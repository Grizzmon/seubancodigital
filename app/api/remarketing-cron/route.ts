import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:suporte@bankpix.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export async function GET(request: Request) {
  try {
    // Proteção opcional do cron
    const authHeader = request.headers.get('authorization')

    if (
      process.env.CRON_SECRET &&
      authHeader !== \`Bearer \${process.env.CRON_SECRET}\`
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json(
        {
          error: 'Variáveis do Supabase não configuradas',
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRole)

    // Usuários FREE cadastrados há mais de 2 horas
    const duasHorasAtras = new Date(
      Date.now() - 2 * 60 * 60 * 1000
    ).toISOString()

    const { data: users, error: userError } = await supabase
      .from('bankpix_users')
      .select('id, name, phone, access_type, created_at')
      .eq('access_type', 'FREE')
      .lt('created_at', duasHorasAtras)

    if (userError) {
      return NextResponse.json(
        {
          error: 'Erro ao buscar usuários',
          details: userError.message,
        },
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
    let expiradas = 0

    for (const user of users) {
      // Busca a subscription vinculada ao usuário
      const { data: subs, error: subError } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', user.id)
        .limit(1)

      if (subError || !subs || subs.length === 0) {
        continue
      }

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
        body: \`\${user.name || 'Você'}, sua conta VIP ainda não foi ativada. Ative agora e comece a receber seus Pix sem limitações 🚀\`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
          url: 'https://seubancodigital.vercel.app/?acesso=vip',
        },
      })

      try {
        await webpush.sendNotification(pushSubscription, payload)
        enviadas++
      } catch (err: any) {
        // Remove subscriptions expiradas automaticamente
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)

          expiradas++
        } else {
          console.error(
            \`Erro ao enviar para \${user.name}:\`,
            err?.message || err
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      total_usuarios: users.length,
      notificacoes_enviadas: enviadas,
      subscriptions_removidas: expiradas,
    })
  } catch (error: any) {
    console.error('Erro crítico no remarketing:', error)

    return NextResponse.json(
      {
        error: 'Erro interno',
        details: error?.message || 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
