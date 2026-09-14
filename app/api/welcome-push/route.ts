import { NextResponse } from 'next/server'
import { getServerSupabase, isUuid } from '@/lib/push-server'
import { sendWelcomePush } from '@/lib/welcome-push'

// Dispara o push "conta aprovada" para TODAS as inscrições de um usuário específico.
// Chamado pelo app logo após o cadastro (modo 'immediate').
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const userId = body?.userId

    if (!isUuid(userId)) {
      return NextResponse.json({ error: 'userId inválido' }, { status: 400 })
    }

    const outcome = await sendWelcomePush(getServerSupabase(), userId)

    switch (outcome.status) {
      case 'sent':
        return NextResponse.json({
          success: outcome.enviadas > 0,
          total: outcome.total,
          enviadas: outcome.enviadas,
        })
      case 'skipped':
        return NextResponse.json({ success: true, skipped: true, reason: outcome.reason })
      case 'pending':
        return NextResponse.json({ success: false, pending: true, reason: outcome.reason })
      case 'not_found':
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      case 'error':
        return NextResponse.json(
          { error: 'Erro ao enviar boas-vindas', details: outcome.message },
          { status: 500 }
        )
    }
  } catch (error: any) {
    console.error('Erro welcome-push:', error)
    return NextResponse.json({ error: 'Erro interno', details: error?.message }, { status: 500 })
  }
}
