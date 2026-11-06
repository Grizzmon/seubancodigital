import { buildOnboardingPushPayload, buildWelcomePushPayload, displayFirstName, APP_URL, APP_NAME } from './push-config'

export const NOTIFICATION_DELAYS = { abandoned: 30, welcome: 5, followup: 120 } as const

export function validBrowserSubscription(subscription: any) {
  try {
    const url = new URL(subscription?.endpoint)
    const provider = url.hostname === 'fcm.googleapis.com' || url.hostname.endsWith('.push.apple.com') ||
      url.hostname.endsWith('.push.services.mozilla.com') || url.hostname.endsWith('.notify.windows.com')
    return url.protocol === 'https:' && !url.port && !url.username && !url.password && provider &&
      /^[A-Za-z0-9_-]{87}=?$/.test(subscription?.keys?.p256dh || '') && /^[A-Za-z0-9_-]{22}={0,2}$/.test(subscription?.keys?.auth || '')
  } catch { return false }
}

export interface ScheduledDevice {
  id: string; endpoint: string; p256dh: string; auth: string; user_id: string | null
  welcome_due_at: string | null; welcome_sent_at: string | null
  followup_due_at: string | null; followup_sent_at: string | null
  abandonment_due_at: string | null; abandonment_sent_at: string | null
}

export function nextDeviceNotice(device: ScheduledDevice, name: string | null, now = Date.now()) {
  const due = (value: string | null) => value !== null && new Date(value).getTime() <= now
  if (!device.user_id) {
    return !device.abandonment_sent_at && due(device.abandonment_due_at)
      ? { kind: 'abandonment' as const, payload: buildOnboardingPushPayload() } : null
  }
  if (!device.welcome_sent_at && due(device.welcome_due_at)) return { kind: 'welcome' as const, payload: buildWelcomePushPayload(name) }
  if (device.welcome_sent_at && !device.followup_sent_at && due(device.followup_due_at)) return {
    kind: 'followup' as const,
    payload: JSON.stringify({ title: `Olá ${displayFirstName(name)}! 👋`,
      body: 'Volte ao RealPayz e continue a configurar as suas chaves Pix 💰', tag: 'realpayz-followup', data: { url: APP_URL } }),
  }
  return null
}

export function activationPayload() {
  return JSON.stringify({ title: `${APP_NAME} 🔔`, body: 'Notificações ativadas! Vamos avisar quando houver novidades na sua conta.',
    tag: 'realpayz-activation', data: { url: APP_URL } })
}
