import { NextResponse } from 'next/server'
import { getServerSupabase, isUuid, sendToSubscriptions } from '@/lib/push-server'
import { buildWelcomePushPayload } from '@/lib/push-config'

// Dispara o push "conta aprovada" para TODAS as inscrições de um usuário específico.
// Chamado pelo app logo após o cadastro (modo 'immediate').
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const userId = body?.userId

    if (!isUuid(userId)) {
      return NextResponse.json({ error: 'userId inválido' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: user, error: userError } = await supabase
      .from('bankpix_users')
      .select('id, name, last_remarketing_sent_at')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      return NextResponse.json(
        { error: 'Erro ao buscar usuário', details: userError.message },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (user.last_remarketing_sent_at) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Notificação de boas-vindas já enviada para este usuário',
      })
    }

    const { data: subs, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (subsError) {
      return NextResponse.json(
        { error: 'Erro ao buscar inscrições', details: subsError.message },
        { status: 500 }
      )
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json({
        success: false,
        pending: true,
        reason: 'Usuário ainda não possui inscrição de push vinculada',
      })
    }

    const result = await sendToSubscriptions(supabase, subs, buildWelcomePushPayload(user.name))

    if (result.enviadas > 0) {
      await supabase
        .from('bankpix_users')
        .update({ last_remarketing_sent_at: new Date().toISOString() })
        .eq('id', userId)
    }

    return NextResponse.json({ success: result.enviadas > 0, total: subs.length, ...result })
  } catch (error: any) {
    console.error('Erro welcome-push:', error)
    return NextResponse.json({ error: 'Erro interno', details: error?.message }, { status: 500 })
  }
}
