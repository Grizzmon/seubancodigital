import { SITE_UNDER_CONSTRUCTION } from '@/lib/site-status'
import { NextResponse } from 'next/server'
import { getServerSupabase, isUuid, sendToSubscriptions } from '@/lib/push-server'
import { sendWelcomePush } from '@/lib/welcome-push'
import { buildWelcomePushPayload } from '@/lib/push-config'

export const maxDuration = 60

export async function POST(request: Request) {
  if (SITE_UNDER_CONSTRUCTION) return NextResponse.json({
    unavailable: true, message: 'O RealPayz está temporariamente indisponível.'
  }, { status: 503, headers: { 'Retry-After': '3600' } })
  try {
    const body = await request.json().catch(() => null)
    if (!isUuid(body?.userId) || typeof body?.endpoint !== 'string') {
      return NextResponse.json({ error: 'Inscrição de notificações obrigatória.' }, { status: 400 })
    }
    const supabase = getServerSupabase()
    // The unguessable browser endpoint must belong to this user. A user ID alone
    // must never allow another visitor to trigger messages to somebody else.
    const { data: sub, error } = await supabase.from('push_subscriptions')
      .select('id, endpoint, p256dh, auth').eq('user_id', body.userId).eq('endpoint', body.endpoint).maybeSingle()
    if (error) throw new Error('Não foi possível consultar a inscrição de notificações.')
    if (!sub) return NextResponse.json({ error: 'Inscrição não encontrada.' }, { status: 404 })

    if (body.test === true) {
      const { data: user } = await supabase.from('bankpix_users').select('name, access_type').eq('id', body.userId).maybeSingle()
      if (!user) return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 })
      const result = await sendToSubscriptions(supabase, [sub], buildWelcomePushPayload(user.name, user.access_type))
      return NextResponse.json({ success: result.enviadas > 0, expired: result.expiradas > 0 },
        { status: result.enviadas > 0 ? 200 : 502 })
    }

    const outcome = await sendWelcomePush(supabase, body.userId)
    if (outcome.status === 'error') throw new Error(outcome.message)
    if (outcome.status === 'not_found') return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 })
    return NextResponse.json({ success: outcome.status === 'skipped' || (outcome.status === 'sent' && outcome.enviadas > 0), status: outcome.status })
  } catch (error) {
    console.error('[welcome-push]', error)
    return NextResponse.json({ error: 'Não foi possível enviar a notificação. Verifique a configuração do servidor.' }, { status: 500 })
  }
}
