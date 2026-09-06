import { NextResponse } from 'next/server'
import { getServerSupabase, isUuid } from '@/lib/push-server'

export async function POST(request: Request) {
  try {
    const { userId, subscription } = await request.json()

    if (
      !isUuid(userId) ||
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // Salva ou atualiza a subscription vinculando ao user_id real
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: 'endpoint' }
    )

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao salvar no banco', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 })
  }
}
