import { randomUUID, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { getServerSupabase, ensureVapid, runPool } from '@/lib/push-server'
import { nextDeviceNotice, type ScheduledDevice } from '@/lib/scheduled-push'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get('authorization') || ''
  const expected = `Bearer ${secret || ''}`
  if (!secret || Buffer.byteLength(header) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(header), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const supabase = getServerSupabase()
  const now = new Date().toISOString()
  const { data: devices, error } = await supabase.from('school_notification_devices').select('*').is('disabled_at', null)
    .or(`welcome_due_at.lte.${now},followup_due_at.lte.${now},abandonment_due_at.lte.${now}`)
    .order('last_seen_at').limit(100)
  if (error) return NextResponse.json({ error: 'Não foi possível consultar os avisos.' }, { status: 503 })
  ensureVapid()
  const totals = { checked: devices?.length || 0, sent: 0, failed: 0, expired: 0 }
  await runPool(devices || [], 10, async (device) => {
    const token = randomUUID()
    const { data: claimed, error: claimError } = await supabase.from('school_notification_devices')
      .update({ claim_token: token, claimed_until: new Date(Date.now() + 120000).toISOString() })
      .eq('id', device.id).or(`claimed_until.is.null,claimed_until.lt.${now}`).select('*').maybeSingle()
    if (claimError || !claimed) return
    try {
      let name: string | null = null
      if (claimed.user_id) {
        const { data: user, error } = await supabase.from('school_accounts').select('name').eq('bankpix_user_id', claimed.user_id).maybeSingle()
        if (error || !user) throw new Error('Conta indisponível')
        name = user.name
      }
      const notice = nextDeviceNotice(claimed as ScheduledDevice, name)
      if (!notice) return
      await webpush.sendNotification({ endpoint: claimed.endpoint, keys: { p256dh: claimed.p256dh, auth: claimed.auth } }, notice.payload,
        { TTL: 86400, urgency: 'high', timeout: 10000 })
      const { error } = await supabase.from('school_notification_devices').update({
        [`${notice.kind}_sent_at`]: new Date().toISOString(), [`${notice.kind}_due_at`]: null,
      }).eq('id', claimed.id).eq('claim_token', token)
      if (error) throw new Error('Não foi possível confirmar o envio')
      totals.sent++
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await supabase.from('school_notification_devices').update({ disabled_at: new Date().toISOString() }).eq('id', device.id)
        totals.expired++
      } else { totals.failed++; console.error('[scheduled-push] delivery failed', error?.statusCode || 'temporary') }
    } finally {
      await supabase.from('school_notification_devices').update({ claim_token: null, claimed_until: null }).eq('id', device.id).eq('claim_token', token)
    }
  })
  // Expired throttle buckets contain only hashes, never PINs or raw addresses.
  await supabase.from('school_auth_limits').delete().lt('resets_at', new Date(Date.now() - 86400000).toISOString())
  return NextResponse.json({ success: true, ...totals })
}
