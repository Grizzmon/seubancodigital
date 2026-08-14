import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { userId, subscription } = await request.json()

    if (!userId || !subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRole)

    // Salva ou atualiza a subscription vinculando ao user_id real
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }, { onConflict: 'endpoint' })

    if (error) {
      return NextResponse.json({ error: 'Erro ao salvar no banco', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 })
  }
}
