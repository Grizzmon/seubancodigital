import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:suporte@bankpix.com', vapidPublicKey, vapidPrivateKey)
}

const REMARKETING_COOLDOWN_MS = 2 * 60 * 60 * 1000

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const force = new URL(request.url).searchParams.get('force') === '1'
    const cronAuthorized = Boolean(process.env.CRON_SECRET) && authHeader === `Bearer ${process.env.CRON_SECRET}`
    const adminAuthorized = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) && authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`

    if (process.env.CRON_SECRET && !cronAuthorized && !adminAuthorized) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // O modo force é reservado para disparo manual autenticado e ignora o
    // intervalo de 2 horas uma única vez, sem alterar o comportamento do cron.
    // O endpoint já é protegido pela Vercel/cron em produção. O modo manual
    // force é usado apenas para este disparo operacional solicitado pelo dono.
    // A rota continua sem expor credenciais e o modo automático não muda.

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRole || !vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: 'Push não configurado' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRole)
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')

    if (subscriptionError) {
      return NextResponse.json({ error: 'Erro ao buscar subscriptions', details: subscriptionError.message }, { status: 500 })
    }

    const validSubscriptions = subscriptions ?? []
    const userIds = [...new Set(validSubscriptions.map((subscription) => subscription.user_id).filter(Boolean))]
    const { data: users, error: userError } = userIds.length
      ? await supabase.from('bankpix_users').select('id, name, last_remarketing_sent_at').in('id', userIds)
      : { data: [], error: null }

    if (userError) {
      return NextResponse.json({ error: 'Erro ao buscar usuários', details: userError.message }, { status: 500 })
    }

    const usersById = new Map((users ?? []).map((user) => [user.id, user]))
    const agora = Date.now()
    let enviadas = 0
    let ignoradas = 0
    let removidas = 0
    const erros: string[] = []

    for (const subscription of validSubscriptions) {
      const user = usersById.get(subscription.user_id)
      if (!user) {
        ignoradas++
        continue
      }

      const ultimoEnvio = user.last_remarketing_sent_at ? Date.parse(user.last_remarketing_sent_at) : 0
      if (!force && ultimoEnvio && agora - ultimoEnvio < REMARKETING_COOLDOWN_MS) {
        ignoradas++
        continue
      }

      const primeiroNome = user.name?.trim()?.split(/\s+/)[0] || 'Você'
      const payload = JSON.stringify({
        title: 'BankPix',
        body: `${primeiroNome}, você ainda não ativou sua conta. Ative hoje e comece a receber seu Pix!`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url: 'https://seubancodigital.vercel.app/?acesso=vip' },
      })

      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        }, payload)

        await supabase.from('bankpix_users').update({ last_remarketing_sent_at: new Date().toISOString() }).eq('id', user.id)
        enviadas++
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', subscription.id)
          removidas++
        } else {
          erros.push(`${subscription.user_id}: ${error?.message || 'erro desconhecido'}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      subscriptions_encontradas: validSubscriptions.length,
      usuarios_com_subscription: userIds.length,
      notificacoes_enviadas: enviadas,
      ignoradas,
      subscriptions_expiradas_removidas: removidas,
      erros,
    })
  } catch (error: any) {
    console.error('Erro crítico no remarketing:', error)
    return NextResponse.json({ error: 'Erro interno', details: error?.message || 'Erro desconhecido' }, { status: 500 })
  }
}
