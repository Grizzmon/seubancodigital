import { NextResponse } from 'next/server'
import { getServerSupabase, sendToSubscriptions, type StoredSubscription } from '@/lib/push-server'
import {
  REMARKETING_MAX_AGE_DAYS,
  WELCOME_PUSH_DELAY_MINUTES,
  WELCOME_PUSH_MODE,
  buildRemarketingPayload,
  nextRemarketingStep,
} from '@/lib/push-config'

// Vercel Cron; a rota precisa de tempo para percorrer todos os utilizadores da janela.
export const maxDuration = 300

const PAGE_SIZE = 1000
// Limite de páginas por execução: 20k utilizadores na janela. O cron corre a cada 15 min,
// por isso o que ficar de fora é apanhado na execução seguinte.
const MAX_PAGES = 20
// O Supabase rejeita URLs muito longas; um IN() com 100 UUIDs fica bem dentro do limite.
const IN_CHUNK = 100

interface EligibleUser {
  id: string
  name: string | null
  access_type: string | null
  created_at: string
  last_remarketing_sent_at: string | null
}

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

    // 1) Percorre os utilizadores da janela em páginas (há dezenas de milhares de contas).
    const pendentes: { user: EligibleUser; step: number }[] = []
    let usuariosNaJanela = 0

    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE
      const { data: users, error: userError } = await supabase
        .from('bankpix_users')
        .select('id, name, access_type, created_at, last_remarketing_sent_at')
        .gte('created_at', janelaInicio)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1)

      if (userError) {
        return NextResponse.json(
          { error: 'Erro ao buscar usuários', details: userError.message },
          { status: 500 }
        )
      }

      const lote = (users || []) as EligibleUser[]
      usuariosNaJanela += lote.length

      for (const user of lote) {
        const step = nextRemarketingStep(user.created_at, user.last_remarketing_sent_at, now)
        if (step === null) continue
        // No modo 'delayed' a primeira mensagem espera o atraso configurado.
        if (step === 0 && welcomeDelayMs > 0) {
          if (now - new Date(user.created_at).getTime() < welcomeDelayMs) continue
        }
        pendentes.push({ user, step })
      }

      if (lote.length < PAGE_SIZE) break
    }

    if (pendentes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum usuário elegível',
        usuarios_na_janela: usuariosNaJanela,
        count: 0,
      })
    }

    // 2) Busca as inscrições em lotes pequenos para não estourar o tamanho da URL.
    const subsByUser = new Map<string, StoredSubscription[]>()
    const userIds = pendentes.map((p) => p.user.id)

    for (let i = 0; i < userIds.length; i += IN_CHUNK) {
      const chunk = userIds.slice(i, i + IN_CHUNK)
      const { data: subs, error: subsError } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth, user_id')
        .in('user_id', chunk)

      if (subsError) {
        return NextResponse.json(
          { error: 'Erro ao buscar inscrições', details: subsError.message },
          { status: 500 }
        )
      }

      for (const sub of subs || []) {
        const list = subsByUser.get(sub.user_id) || []
        list.push(sub)
        subsByUser.set(sub.user_id, list)
      }
    }

    // 3) Envia o passo pendente para quem tem inscrição.
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
      usuarios_na_janela: usuariosNaJanela,
      usuarios_pendentes: pendentes.length,
      usuarios_com_inscricao: subsByUser.size,
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
