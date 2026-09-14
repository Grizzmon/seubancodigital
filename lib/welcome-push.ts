import type { SupabaseClient } from '@supabase/supabase-js'
import { sendToSubscriptions } from './push-server'
import { buildWelcomePushPayload } from './push-config'

export type WelcomePushOutcome =
  | { status: 'sent'; enviadas: number; total: number }
  | { status: 'skipped'; reason: string }
  | { status: 'pending'; reason: string }
  | { status: 'not_found' }
  | { status: 'error'; message: string }

// Envia o push "conta aprovada" para todas as inscrições de um utilizador,
// uma única vez (controlado por last_remarketing_sent_at).
// Usado tanto pela rota /api/welcome-push quanto pelo vínculo da inscrição,
// para que a mensagem saia mesmo que o cliente não chegue a chamar a API.
export async function sendWelcomePush(
  supabase: SupabaseClient,
  userId: string
): Promise<WelcomePushOutcome> {
  const { data: user, error: userError } = await supabase
    .from('bankpix_users')
    .select('id, name, access_type, last_remarketing_sent_at')
    .eq('id', userId)
    .maybeSingle()

  if (userError) return { status: 'error', message: userError.message }
  if (!user) return { status: 'not_found' }

  if (user.last_remarketing_sent_at) {
    return { status: 'skipped', reason: 'Notificação de boas-vindas já enviada para este usuário' }
  }

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (subsError) return { status: 'error', message: subsError.message }

  if (!subs || subs.length === 0) {
    return { status: 'pending', reason: 'Usuário ainda não possui inscrição de push vinculada' }
  }

  const result = await sendToSubscriptions(
    supabase,
    subs,
    buildWelcomePushPayload(user.name, user.access_type)
  )

  if (result.enviadas > 0) {
    await supabase
      .from('bankpix_users')
      .update({ last_remarketing_sent_at: new Date().toISOString() })
      .eq('id', userId)
  }

  return { status: 'sent', enviadas: result.enviadas, total: subs.length }
}
