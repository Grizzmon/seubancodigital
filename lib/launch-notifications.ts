import webpush from 'web-push'
import { ensureVapid, runPool, type StoredSubscription } from './push-server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { APP_NAME, APP_URL, NOTIFICATION_ICON, NOTIFICATION_BADGE } from './push-config'

// Called only when maintenance has been disabled. A notification accepted by the
// provider is marked once; failures remain pending for the next cron execution.
export async function sendLaunchNotifications(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('launch_subscriptions')
    .select('id,endpoint,p256dh,auth').is('notified_at', null).order('created_at').limit(100)
  if (error) { console.error('[launch] unable to read launch list', error.code); return { sent: 0, pending: true } }
  if (!data?.length) return { sent: 0, pending: false }
  ensureVapid()
  const payload = JSON.stringify({ title: `${APP_NAME} está disponível! 🎉`,
    body: 'Terminámos os ajustes. Já pode voltar ao RealPayz. Obrigado por esperar! ❤️',
    tag: 'realpayz-launch', icon: NOTIFICATION_ICON, badge: NOTIFICATION_BADGE, data: { url: APP_URL } })
  let sent = 0
  await runPool(data as StoredSubscription[], 10, async (subscription) => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload,
        { TTL: 259200, urgency: 'high', topic: 'realpayz-launch', timeout: 10000 })
      const { error: markError } = await supabase.from('launch_subscriptions')
        .update({ notified_at: new Date().toISOString() }).eq('id', subscription.id)
      if (markError) console.error('[launch] unable to mark accepted notification', markError.code)
      sent++
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await supabase.from('launch_subscriptions').delete().eq('id', subscription.id)
      } else console.error('[launch] push failed', { status })
    }
  })
  return { sent, pending: data.length === 100 }
}
