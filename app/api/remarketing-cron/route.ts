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
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    // Usando a Service Role Key para garantir acesso total nas tabelas pelo Cron, com fallback para anon
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase não configurado corretamente nas variáveis de ambiente' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    const { data: users, error: dbError } = await supabase
      .from('bankpix_users')
      .select(`
        id,
        first_name,
        phone,
        push_subscriptions (
          endpoint,
          p256dh,
          auth
        )
      `)
      .eq('plan', 'free')
      .eq('push_enabled', true)
      .is('vip_activated_at', null)
      .lt('created_at', duasHorasAtras)
      .is('last_remarketing_sent_at', null)

    if (dbError) {
      console.error('Erro detalhado do Supabase:', dbError)
      return NextResponse.json({ error: 'Erro no banco de dados', details: dbError.message }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'Nenhum usuário pendente no momento.', count: 0 })
    }

    let enviadas = 0
    const agora = new Date().toISOString()

    for (const user of users) {
      const subs = user.push_subscriptions as any[]
      if (subs && subs.length > 0) {
        const subData = subs[0]

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

          await supabase
            .from('bankpix_users')
            .update({ last_remarketing_sent_at: agora })
            .eq('id', user.id)

          enviadas++
        } catch (err: any) {
          console.error(`Erro ao disparar push para o usuário ${user.id}:`, err)
        }
      }
    }

    return NextResponse.json({ success: true, enviadas })
  } catch (error: any) {
    console.error('Erro crítico no cron de remarketing:', error)
    // Retorna o erro real temporariamente para visualização na tela
    return NextResponse.json({ error: 'Erro interno', details: error.message, stack: error.stack }, { status: 500 })
  }
}
