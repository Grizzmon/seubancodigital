import { NextResponse } from 'next/server'
import { getServerSupabase, isUuid } from '@/lib/push-server'
import { WELCOME_PUSH_MODE } from '@/lib/push-config'
import { sendWelcomePush } from '@/lib/welcome-push'

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

    // A inscrição acabou de ficar utilizável: dispara as boas-vindas já do lado do servidor,
    // sem depender de o cliente chamar /api/welcome-push a seguir. Só sai uma vez por usuário.
    let welcome: string | undefined
    if (WELCOME_PUSH_MODE === 'immediate') {
      const outcome = await sendWelcomePush(supabase, userId).catch((err: any) => ({
        status: 'error' as const,
        message: err?.message || 'erro desconhecido',
      }))
      welcome = outcome.status
      if (outcome.status === 'error') console.error('[save-subscription] boas-vindas:', outcome.message)
    }

    return NextResponse.json({ success: true, welcome })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 })
  }
}
