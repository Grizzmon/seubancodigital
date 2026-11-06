import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { getServerSupabase, ensureVapid } from '@/lib/push-server'
import { schoolIdentity, setSchoolCookies, validSameOrigin } from '@/lib/school-auth'
import { validBrowserSubscription, NOTIFICATION_DELAYS, activationPayload } from '@/lib/scheduled-push'

export const maxDuration = 60

export async function POST(request: Request) {
  if (!validSameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 })
  try {
    const body = await request.json()
    const subscription = body?.subscription
    if (!validBrowserSubscription(subscription)) return NextResponse.json({ error: 'Inscrição inválida.' }, { status: 400 })
    const supabase = getServerSupabase()
    const { data: existing, error: lookupError } = await supabase.from('school_notification_devices').select('*').eq('endpoint', subscription.endpoint).maybeSingle()
    if (lookupError) throw new Error('Não foi possível ler a inscrição.')
    const identity = await schoolIdentity(request)
    let userId: string | null = existing?.user_id || null
    let accountCreatedAt: string | null = null
    if (identity.user) {
      const { data: account, error } = await supabase.from('school_accounts').select('bankpix_user_id,created_at').eq('auth_user_id', identity.user.id).maybeSingle()
      if (error) throw new Error('Não foi possível vincular a conta.')
      userId = account?.bankpix_user_id || userId
      accountCreatedAt = account?.created_at || null
    }
    const now = Date.now()
    const after = (minutes: number) => new Date(now + minutes * 60000).toISOString()
    const update: Record<string, unknown> = {
      endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth,
      user_id: userId, last_seen_at: new Date(now).toISOString(), disabled_at: null,
    }
    if (userId) {
      update.abandonment_due_at = null
      // Account switching on a shared device starts a new account-specific sequence.
      if (!existing || existing.user_id !== userId) Object.assign(update, {
        welcome_due_at: accountCreatedAt ? new Date(Math.max(new Date(accountCreatedAt).getTime() + NOTIFICATION_DELAYS.welcome * 60000, now)).toISOString() : after(NOTIFICATION_DELAYS.welcome),
        followup_due_at: accountCreatedAt ? new Date(Math.max(new Date(accountCreatedAt).getTime() + NOTIFICATION_DELAYS.followup * 60000, now + NOTIFICATION_DELAYS.followup * 60000)).toISOString() : after(NOTIFICATION_DELAYS.followup),
        welcome_sent_at: null, followup_sent_at: null,
      })
    } else {
      update.abandonment_due_at = body.action === 'exit' && !existing?.abandonment_sent_at ? after(NOTIFICATION_DELAYS.abandoned) : null
    }
    const { error } = await supabase.from('school_notification_devices').upsert(update, { onConflict: 'endpoint' })
    if (error) throw new Error('Não foi possível guardar os avisos.')
    let activationSent = false
    if (body.action === 'activate') {
      ensureVapid()
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: subscription.keys }, activationPayload(),
        { TTL: 3600, urgency: 'high', timeout: 10000 })
      activationSent = true
    }
    const response = NextResponse.json({ success: true, activationSent, hasAccount: Boolean(userId), schedule: NOTIFICATION_DELAYS })
    if (identity.refreshed) return setSchoolCookies(response, identity.refreshed)
    return response
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.statusCode === 410) return NextResponse.json({ expired: true, error: 'A inscrição expirou. Volte a ativar as notificações.' }, { status: 410 })
    console.error('[notification-device]', error instanceof Error ? error.message : 'Unable to save')
    return NextResponse.json({ error: 'Não foi possível ativar os avisos. Tente novamente.' }, { status: 503 })
  }
}
