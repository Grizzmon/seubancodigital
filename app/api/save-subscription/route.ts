import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { userId, subscription } = await request.json()
    const endpoint = subscription?.endpoint
    const p256dh = subscription?.keys?.p256dh
    const auth = subscription?.keys?.auth

    if (!userId || !endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Confirma que o UUID pertence a um usuário real antes do upsert.
    // Isso também impede subscriptions órfãs causadas por localStorage inválido.
    if (!/^[0-9a-f-]{36}$/i.test(userId)) {
      return NextResponse.json({ error: 'user_id inválido' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRole)

    const { data: user, error: userError } = await supabase
      .from('bankpix_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      return NextResponse.json({ error: 'Erro ao validar usuário', details: userError.message }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const { data: saved, error } = await supabase
      .from('push_subscriptions')
      .upsert({ user_id: userId, endpoint, p256dh, auth }, { onConflict: 'endpoint' })
      .select('id, user_id, endpoint')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao salvar no banco', details: error.message }, { status: 500 })
    }

    const { error: enabledError } = await supabase
      .from('bankpix_users')
      .update({ push_enabled: true })
      .eq('id', userId)

    if (enabledError) {
      return NextResponse.json({ error: 'Subscription salva, mas usuário não atualizado', details: enabledError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, subscription: saved })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 })
  }
}
