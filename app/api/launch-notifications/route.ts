import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/push-server'

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin')
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 })
    const { subscription } = await request.json()
    const url = new URL(subscription?.endpoint)
    const provider = url.hostname === 'fcm.googleapis.com' || url.hostname.endsWith('.push.apple.com') ||
      url.hostname.endsWith('.push.services.mozilla.com') || url.hostname.endsWith('.notify.windows.com')
    if (url.protocol !== 'https:' || !provider ||
      !/^[A-Za-z0-9_-]{87}=?$/.test(subscription?.keys?.p256dh ?? '') ||
      !/^[A-Za-z0-9_-]{22}={0,2}$/.test(subscription?.keys?.auth ?? '')) {
      return NextResponse.json({ error: 'Inscrição inválida.' }, { status: 400 })
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Avisos temporariamente indisponíveis.' }, { status: 503 })
    const { error } = await getServerSupabase().from('launch_subscriptions').upsert({
      endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth,
    }, { onConflict: 'endpoint' }).abortSignal(AbortSignal.timeout(8000))
    if (error) return NextResponse.json({ error: 'Não foi possível confirmar o aviso. Tente mais tarde.' }, { status: 503 })
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Não foi possível confirmar o aviso.' }, { status: 503 })
  }
}
