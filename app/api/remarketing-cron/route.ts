import { NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:suporte@bankpix.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })
    }

    const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    // 1. Busca otimizada via JOIN unindo usuário e subscription elegíveis
    const query = `select=id,first_name,phone,push_subscriptions(endpoint,p256dh,auth)&plan=eq.free&push_enabled=eq.true&vip_activated_at=is.null&created_at=lt.${duasHorasAtras}&last_remarketing_sent_at=is.null`

    const res = await fetch(`${supabaseUrl}/rest/v1/bankpix_users?${query}`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    })

    if (!res.ok) {
      throw new Error('Erro ao consultar usuários elegíveis para remarketing')
    }

    const users = await res.json()

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'Nenhum usuário pendente no momento.', count: 0 })
    }

    let enviadas = 0
    const agora = new Date().toISOString()

    for (const user of users) {
      if (user.push_subscriptions && user.push_subscriptions.length > 0) {
        const subData = user.push_subscriptions[0]

        const pushSubscription = {
          endpoint: subData.endpoint,
          keys: {
            p256dh: subData.p256dh,
            auth: subData.auth,
          },
        }

        const payload = JSON.stringify({
          title: 'BankPix',
          body: `${user.first_name}, você ainda não ativou sua conta VIP. Ative agora e comece a receber seus Pix sem limitações 🚀`,
          data: {
            url: 'https://seubancodigital.vercel.app/?acesso=vip',
          },
        })

        try {
          await webpush.sendNotification(pushSubscription, payload)

          // 2. Trava de segurança: Atualiza o usuário para marcar que o remarketing foi enviado
          await fetch(`${supabaseUrl}/rest/v1/bankpix_users?id=eq.${user.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
              last_remarketing_sent_at: agora,
            }),
          })

          enviadas++
        } catch (err) {
          console.error(`Erro ao disparar push para o usuário ${user.id}:`, err)
        }
      }
    }

    return NextResponse.json({ success: true, enviadas })
  } catch (error) {
    console.error('Erro no cron de remarketing:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
