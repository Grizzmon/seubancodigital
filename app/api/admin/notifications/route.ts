import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const COOLDOWN_MS = 2 * 60 * 60 * 1000

function getAdminClient(request: NextRequest) {
  const secret = process.env.ADMIN_PANEL_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.nextUrl.searchParams.get('key')
  if (!secret || !supplied || supplied !== secret) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!url || !serviceRole || !publicKey || !privateKey) return null

  webpush.setVapidDetails('mailto:suporte@bankpix.com', publicKey, privateKey)
  return createClient(url, serviceRole)
}

async function getQueue(supabase: ReturnType<typeof createClient>) {
  // Usamos somente colunas confirmadas pelo fluxo principal do remarketing.
  // Colunas opcionais de nome variam entre ambientes e faziam a fila falhar inteira.
  const [{ data: subscriptions, error: subscriptionsError }, { data: users, error: usersError }] = await Promise.all([
    supabase.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth'),
    supabase.from('bankpix_users').select('id, name, last_remarketing_sent_at'),
  ])

  if (subscriptionsError) throw subscriptionsError
  if (usersError) throw usersError

  const usersById = new Map((users ?? []).map((user) => [user.id, user]))
  const now = Date.now()
  const rows = (subscriptions ?? []).map((subscription) => {
    const user = usersById.get(subscription.user_id)
    const lastSent = user?.last_remarketing_sent_at ? new Date(user.last_remarketing_sent_at).getTime() : 0
    const name = user?.name?.trim() || 'usuário'
    return { ...subscription, name, userFound: Boolean(user), eligible: !lastSent || now - lastSent >= COOLDOWN_MS }
  })

  return { rows, eligible: rows.filter((row) => row.userFound && row.eligible), totalSubscriptions: rows.length }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient(request)
    if (!supabase) return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 })
    const queue = await getQueue(supabase)
    return NextResponse.json({
      totalSubscriptions: queue.totalSubscriptions,
      eligibleCount: queue.eligible.length,
      rows: queue.eligible.map(({ endpoint, ...row }) => row),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao consultar fila' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient(request)
    if (!supabase) return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 })

    const queue = await getQueue(supabase)
    if (queue.eligible.length === 0) {
      return NextResponse.json({ sent: 0, eligibleCount: 0, message: 'Não há novos usuários para notificar.' })
    }

    let sent = 0
    let removed = 0
    const errors: string[] = []
    for (const row of queue.eligible) {
      const subscription = await supabase.from('push_subscriptions').select('endpoint, p256dh, auth').eq('id', row.id).maybeSingle()
      if (subscription.error || !subscription.data) continue
      try {
        await webpush.sendNotification(
          { endpoint: subscription.data.endpoint, keys: { p256dh: subscription.data.p256dh, auth: subscription.data.auth } },
          JSON.stringify({ title: 'BankPix', body: `${row.name}, você ainda não ativou a sua conta. Ative hoje e comece a receber seu Pix!`, url: '/' }),
        )
        sent += 1
        await supabase.from('bankpix_users').update({ last_remarketing_sent_at: new Date().toISOString() }).eq('id', row.user_id)
      } catch (error: unknown) {
        const statusCode = error && typeof error === 'object' && 'statusCode' in error ? Number(error.statusCode) : 0
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', row.id)
          removed += 1
        } else errors.push(row.name)
      }
    }

    return NextResponse.json({ sent, eligibleCount: queue.eligible.length, removed, errors: errors.length, message: `${sent} notificação(ões) enviada(s).` })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao disparar notificações' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
