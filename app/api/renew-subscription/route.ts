import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/push-server'

// Chamada pelo service worker quando o navegador troca a inscrição de push
// (evento "pushsubscriptionchange"). Sem isto, o utilizador deixaria de receber
// notificações em silêncio. O dono é descoberto pelo endpoint antigo.
export async function POST(request: Request) {
  try {
    const { oldEndpoint, subscription } = await request.json().catch(() => ({}))

    if (
      typeof oldEndpoint !== 'string' ||
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: old, error: findError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id')
      .eq('endpoint', oldEndpoint)
      .maybeSingle()

    if (findError) {
      return NextResponse.json({ error: 'Erro ao consultar inscrição', details: findError.message }, { status: 500 })
    }
    if (!old) {
      return NextResponse.json({ error: 'Inscrição anterior não encontrada' }, { status: 404 })
    }

    const { error: upsertError } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: old.user_id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: 'endpoint' }
    )

    if (upsertError) {
      return NextResponse.json({ error: 'Erro ao salvar', details: upsertError.message }, { status: 500 })
    }

    if (oldEndpoint !== subscription.endpoint) {
      await supabase.from('push_subscriptions').delete().eq('id', old.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno', details: error?.message }, { status: 500 })
  }
}
