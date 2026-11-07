import { buildOnboardingPushPayload, buildWelcomePushPayload, displayFirstName, APP_URL, APP_NAME } from './push-config'

export const NOTIFICATION_DELAYS = { abandoned: 30, welcome: 5, followup: 120, day1: 1440, day1followup: 1680 } as const

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
  day1_due_at?: string | null; day1_sent_at?: string | null
  day1followup_due_at?: string | null; day1followup_sent_at?: string | null
  abandonment_due_at: string | null; abandonment_sent_at: string | null
}

export function nextDeviceNotice(device: ScheduledDevice, name: string | null, now = Date.now()) {
  const due = (value: string | null | undefined) => value != null && new Date(value).getTime() <= now
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
  if (!device.day1_sent_at && due(device.day1_due_at)) return {
    kind: 'day1' as const,
    payload: JSON.stringify({ title: `Olá ${displayFirstName(name)}! 👋`,
      body: 'Sua conta de demonstração está ativa ✅ Cadastre uma chave de exemplo e experimente receber Pix simulados em reais 💰',
      tag: 'realpayz-demo-day1', data: { url: APP_URL } }),
  }
  // Keep four hours between these reminders even after an offline period or delayed cron.
  if (device.day1_sent_at && !device.day1followup_sent_at && due(device.day1followup_due_at) &&
      now >= Date.parse(device.day1_sent_at) + 4 * 60 * 60000) return {
    kind: 'day1followup' as const,
    payload: JSON.stringify({ title: `Olá ${displayFirstName(name)}! 👋`,
      body: 'Continue a explorar o RealPayz na demonstração escolar: experimente as chaves de exemplo e os Pix simulados.',
      tag: 'realpayz-demo-day1-followup', data: { url: APP_URL } }),
  }
  return null
}

export function dayOneSchedule(accountCreatedAt: string | null, now = Date.now()) {
  // Late permission grants start a fresh day instead of delivering a backlog at once.
  const start = Math.max(accountCreatedAt ? Date.parse(accountCreatedAt) || now : now, now)
  return {
    day1_due_at: new Date(start + NOTIFICATION_DELAYS.day1 * 60000).toISOString(),
    day1followup_due_at: new Date(start + NOTIFICATION_DELAYS.day1followup * 60000).toISOString(),
    day1_sent_at: null, day1followup_sent_at: null,
  }
}

export function activationPayload() {
  return JSON.stringify({ title: `${APP_NAME} 🔔`, body: 'Notificações ativadas! Vamos avisar quando houver novidades na sua conta.',
    tag: 'realpayz-activation', data: { url: APP_URL } })
}
