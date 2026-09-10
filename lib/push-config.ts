// Configuração central do push de boas-vindas ("conta aprovada").
//
// WELCOME_PUSH_MODE
//   'immediate' -> dispara assim que a conta é criada e a inscrição de push é vinculada (modo de teste).
//   'delayed'   -> não dispara no cadastro; o cron (/api/remarketing-cron) envia após WELCOME_PUSH_DELAY_MINUTES.
//
// Em ambos os modos o cron funciona como rede de segurança: quem ainda não recebeu
// (ex.: aceitou a permissão de notificação mais tarde) recebe na próxima execução.
export const WELCOME_PUSH_MODE: 'immediate' | 'delayed' = 'immediate'

export const WELCOME_PUSH_DELAY_MINUTES = 25

// O cron só considera contas criadas dentro desta janela, para não disparar
// "conta aprovada" para toda a base antiga de uma vez.
export const WELCOME_PUSH_MAX_AGE_HOURS = 24

export const APP_URL = 'https://seubancodigital.vercel.app/'

// Identidade usada em todas as notificações (deve bater com public/sw.js).
export const APP_NAME = 'RealPayz'
export const NOTIFICATION_ICON = '/notification-icon-192.png'
export const NOTIFICATION_BADGE = '/notification-badge-96.png'
export const VAPID_CONTACT = 'mailto:suporte@realpayz.app'

export function buildWelcomePushPayload(name?: string | null) {
  const firstName = (name || '').trim().split(/\s+/)[0]
  const displayName = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
    : 'Cliente'

  return JSON.stringify({
    title: APP_NAME,
    body: `Parabéns! ${displayName}, sua conta foi aprovada. Conclua os passos e use o Pix sem limites!`,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    tag: 'realpayz-welcome',
    data: { url: APP_URL },
  })
}
