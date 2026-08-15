import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

// Não inicializa o web-push durante o build quando as variáveis não estão
// disponíveis. A rota retorna um erro claro somente se for chamada sem VAPID.
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:suporte@bankpix.com',
    vapidPublicKey,
    vapidPrivateKey
  )
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')

    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRole || !vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: 'Supabase não configurado' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRole)

    // Ajustado para 0 para permitir testes imediatos (sem espera de 2 horas)
    const duasHorasAtras = new Date(
      Date.now() - 0
    ).toISOString()

    // Adicionado .is('last_remarketing_sent_at', null) para evitar reenvios repetidos
    const { data: users, error: userError } = await supabase
      .from('bankpix_users')
      .select('id, name, created_at')
      .eq('access_type', 'FREE')
      .lt('created_at', duasHorasAtras)
      .is('last_remarketing_sent_at', null)

    if (userError) {
      return NextResponse.json(
        { error: 'Erro ao buscar usuários', details: userError.message },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum usuário elegível no momento',
        count: 0,
      })
    }

    let enviadas = 0
    const agora = new Date().toISOString()

    for (const user of users) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', user.id)
        .limit(1)

      if (!subs || subs.length === 0) continue

      const sub = subs[0]

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      const payload = JSON.stringify({
        title: 'BankPix',
        body: `${user.name || 'Você'}, sua conta VIP ainda não foi ativada. Ative agora e comece a receber seus Pix sem limitações 🚀`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
          url: 'https://seubancodigital.vercel.app/?acesso=vip',
        },
      })

      try {
        await webpush.sendNotification(pushSubscription, payload)

        // Atualiza a trava para registrar que o remarketing foi enviado com sucesso para este usuário
        await supabase
          .from('bankpix_users')
          .update({ last_remarketing_sent_at: agora })
          .eq('id', user.id)

        enviadas++
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
        } else {
          console.error('Erro ao enviar push:', err)
        }
      }
    }

    return NextResponse.json({
      success: true,
      notificacoes_enviadas: enviadas,
    })
  } catch (error: any) {
    console.error('Erro crítico:', error)

    return NextResponse.json(
      {
        error: 'Erro interno',
        details: error?.message || 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
