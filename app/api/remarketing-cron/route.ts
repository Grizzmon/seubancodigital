import { NextResponse } from 'next/server'
import { getServerSupabase, sendToSubscriptions, type StoredSubscription } from '@/lib/push-server'
import {
  WELCOME_PUSH_DELAY_MINUTES,
  WELCOME_PUSH_MAX_AGE_HOURS,
  WELCOME_PUSH_MODE,
  buildWelcomePushPayload,
} from '@/lib/push-config'

// Executado pelo Vercel Cron (ver vercel.json).
// Envia o push "conta aprovada" para todo usuário que:
//   - foi criado há pelo menos X minutos (X = 0 no modo 'immediate', WELCOME_PUSH_DELAY_MINUTES no modo 'delayed')
//   - ainda não recebeu (last_remarketing_sent_at nulo)
//   - possui pelo menos uma inscrição de push vinculada
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')

    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = getServerSupabase()

    const delayMinutes = WELCOME_PUSH_MODE === 'delayed' ? WELCOME_PUSH_DELAY_MINUTES : 0
    const limite = new Date(Date.now() - delayMinutes * 60_000).toISOString()
    const janelaInicio = new Date(Date.now() - WELCOME_PUSH_MAX_AGE_HOURS * 3_600_000).toISOString()

    const { data: users, error: userError } = await supabase
      .from('bankpix_users')
      .select('id, name, created_at')
      .lte('created_at', limite)
      .gte('created_at', janelaInicio)
      .is('last_remarketing_sent_at', null)
      .order('created_at', { ascending: false })
      .limit(500)

    if (userError) {
      return NextResponse.json(
        { error: 'Erro ao buscar usuários', details: userError.message },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhum usuário elegível', count: 0 })
    }

    const userIds = users.map((u) => u.id)

    const { data: subs, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, user_id')
      .in('user_id', userIds)

    if (subsError) {
      return NextResponse.json(
        { error: 'Erro ao buscar inscrições', details: subsError.message },
        { status: 500 }
      )
    }

    const subsByUser = new Map<string, StoredSubscription[]>()
    for (const sub of subs || []) {
      const list = subsByUser.get(sub.user_id) || []
      list.push(sub)
      subsByUser.set(sub.user_id, list)
    }

    let usuariosNotificados = 0
    let notificacoesEnviadas = 0
    let expiradasRemovidas = 0
    const agora = new Date().toISOString()

    for (const user of users) {
      const userSubs = subsByUser.get(user.id)
      if (!userSubs || userSubs.length === 0) continue

      const result = await sendToSubscriptions(supabase, userSubs, buildWelcomePushPayload(user.name))

      notificacoesEnviadas += result.enviadas
      expiradasRemovidas += result.expiradas

      if (result.enviadas > 0) {
        usuariosNotificados++
        await supabase
          .from('bankpix_users')
          .update({ last_remarketing_sent_at: agora })
          .eq('id', user.id)
      }
    }

    return NextResponse.json({
      success: true,
      modo: WELCOME_PUSH_MODE,
      atraso_minutos: delayMinutes,
      usuarios_elegiveis: users.length,
      usuarios_notificados: usuariosNotificados,
      notificacoes_enviadas: notificacoesEnviadas,
      expiradas_removidas: expiradasRemovidas,
    })
  } catch (error: any) {
    console.error('Erro crítico no cron:', error)
    return NextResponse.json(
      { error: 'Erro interno', details: error?.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
