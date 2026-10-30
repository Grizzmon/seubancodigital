import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { ensureVapid, getServerSupabase } from '@/lib/push-server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin')
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 })
    }
    const { subscription } = await request.json()
    const url = new URL(subscription?.endpoint)
    const hostname = url.hostname
    const provider = hostname === 'fcm.googleapis.com' ||
      hostname.endsWith('.push.apple.com') ||
      hostname.endsWith('.push.services.mozilla.com') ||
      hostname.endsWith('.notify.windows.com')
    if (url.protocol !== 'https:' || !provider ||
      !/^[A-Za-z0-9_-]{87}=?$/.test(subscription?.keys?.p256dh ?? '') ||
      !/^[A-Za-z0-9_-]{22}={0,2}$/.test(subscription?.keys?.auth ?? '')) {
      return NextResponse.json({ error: 'Inscrição inválida.' }, { status: 400 })
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Servidor de notificações sem configuração.' }, { status: 503 })
    }

    const supabase = getServerSupabase()
    const { data: existing, error: lookupError } = await supabase.from('launch_subscriptions')
      .select('id,notified_at').eq('endpoint', subscription.endpoint).maybeSingle()
    if (lookupError) {
      console.error('[launch-push] lookup failed', lookupError.code, lookupError.message)
      return NextResponse.json({ error: 'Não foi possível consultar o registo.' }, { status: 503 })
    }
    const { data: saved, error } = await supabase.from('launch_subscriptions').upsert({
      endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth,
    }, { onConflict: 'endpoint' }).select('id,notified_at').single()
    if (error || !saved) {
      console.error('[launch-push] save failed', error?.code, error?.message)
      return NextResponse.json({ error: 'Não foi possível guardar a inscrição.' }, { status: 503 })
    }

    // First successful registration triggers exactly one real Web Push test.
    // Existing confirmed devices are never sent another test on page reload.
    if (!existing?.notified_at && !saved.notified_at) {
      try {
        ensureVapid()
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
        }, JSON.stringify({
          title: 'RealPayz 🔔',
          body: 'Teste concluído! As notificações do RealPayz estão a funcionar neste dispositivo.',
          tag: 'realpayz-first-test',
          data: { url: '/' },
        }), { TTL: 3600, urgency: 'high', timeout: 10000 })
        const { error: updateError } = await supabase.from('launch_subscriptions')
          .update({ notified_at: new Date().toISOString() }).eq('id', saved.id)
        if (updateError) console.error('[launch-push] mark delivered failed', updateError.code)
        return NextResponse.json({ success: true, testSent: true }, { headers: { 'Cache-Control': 'no-store' } })
      } catch (pushError: unknown) {
        const status = typeof pushError === 'object' && pushError !== null && 'statusCode' in pushError
          ? Number(pushError.statusCode) : undefined
        console.error('[launch-push] test failed', status, pushError instanceof Error ? pushError.message : 'unknown')
        if (status === 404 || status === 410) {
          await supabase.from('launch_subscriptions').delete().eq('id', saved.id)
        }
        return NextResponse.json({
          error: status === 404 || status === 410
            ? 'A inscrição expirou. Volte a ativar as notificações.'
            : 'Inscrição guardada, mas o envio de teste falhou. Verifique as chaves VAPID e tente novamente.',
          registered: status !== 404 && status !== 410,
          testSent: false,
        }, { status: 503 })
      }
    }
    return NextResponse.json({ success: true, testSent: false, alreadyTested: true },
      { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[launch-push] unexpected error', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Não foi possível confirmar o aviso.' }, { status: 503 })
  }
}
