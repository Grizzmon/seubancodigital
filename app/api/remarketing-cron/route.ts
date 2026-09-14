import { NextResponse } from 'next/server'
import { getServerSupabase, sendToSubscriptions, type StoredSubscription } from '@/lib/push-server'
import {
  REMARKETING_MAX_AGE_DAYS,
  WELCOME_PUSH_DELAY_MINUTES,
  WELCOME_PUSH_MODE,
  buildRemarketingPayload,
  nextRemarketingStep,
} from '@/lib/push-config'

// Executado pelo Vercel Cron (ver vercel.json).
// Para cada utilizador com inscrição de push, envia o próximo passo da sequência
// de remarketing (lib/push-config.ts) cujo tempo mínimo já passou e ainda não foi enviado.
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')

    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = getServerSupabase()
    const now = Date.now()

    const welcomeDelayMs = (WELCOME_PUSH_MODE === 'delayed' ? WELCOME_PUSH_DELAY_MINUTES : 0) * 60_000
    const janelaInicio = new Date(now - REMARKETING_MAX_AGE_DAYS * 86_400_000).toISOString()

    const { data: users, error: userError } = await supabase
      .from('bankpix_users')
      .select('id, name, access_type, created_at, last_remarketing_sent_at')
      .gte('created_at', janelaInicio)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (userError) {
      return NextResponse.json(
        { error: 'Erro ao buscar usuários', details: userError.message },
        { status: 500 }
      )
    }

    // Só quem tem algo pendente na sequência.
    const pendentes = (users || [])
      .map((user) => {
        const step = nextRemarketingStep(user.created_at, user.last_remarketing_sent_at, now)
        return step === null ? null : { user, step }
      })
      .filter((item): item is { user: NonNullable<typeof users>[number]; step: number } => {
        if (!item) return false
        // No modo 'delayed' a primeira mensagem espera o atraso configurado.
        if (item.step === 0 && welcomeDelayMs > 0) {
          return now - new Date(item.user.created_at).getTime() >= welcomeDelayMs
        }
        return true
      })

    if (pendentes.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhum usuário elegível', count: 0 })
    }

    const userIds = pendentes.map((p) => p.user.id)

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
    const porPasso: Record<number, number> = {}
    const agora = new Date().toISOString()

    for (const { user, step } of pendentes) {
      const userSubs = subsByUser.get(user.id)
      if (!userSubs || userSubs.length === 0) continue

      const result = await sendToSubscriptions(
        supabase,
        userSubs,
        buildRemarketingPayload(step, user.name, user.access_type)
      )

      notificacoesEnviadas += result.enviadas
      expiradasRemovidas += result.expiradas

      if (result.enviadas > 0) {
        usuariosNotificados++
        porPasso[step] = (porPasso[step] || 0) + 1
        await supabase
          .from('bankpix_users')
          .update({ last_remarketing_sent_at: agora })
          .eq('id', user.id)
      }
    }

    return NextResponse.json({
      success: true,
      modo: WELCOME_PUSH_MODE,
      usuarios_pendentes: pendentes.length,
      usuarios_notificados: usuariosNotificados,
      notificacoes_enviadas: notificacoesEnviadas,
      expiradas_removidas: expiradasRemovidas,
      por_passo: porPasso,
    })
  } catch (error: any) {
    console.error('Erro crítico no cron:', error)
    return NextResponse.json(
      { error: 'Erro interno', details: error?.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
