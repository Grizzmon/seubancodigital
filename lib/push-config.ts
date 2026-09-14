// Configuração central das notificações push.
//
// WELCOME_PUSH_MODE
//   'immediate' -> a primeira mensagem dispara assim que a conta é criada e a inscrição é vinculada.
//   'delayed'   -> a primeira mensagem fica a cargo do cron, após WELCOME_PUSH_DELAY_MINUTES.
//
// Em ambos os modos o cron (/api/remarketing-cron) é a rede de segurança e também
// envia a sequência de remarketing (REMARKETING_SEQUENCE) ao longo dos dias.
export const WELCOME_PUSH_MODE: 'immediate' | 'delayed' = 'immediate'

export const WELCOME_PUSH_DELAY_MINUTES = 25

// O cron só considera contas criadas dentro desta janela.
export const REMARKETING_MAX_AGE_DAYS = 30

export const APP_URL = 'https://seubancodigital.vercel.app/'

// Identidade usada em todas as notificações (deve bater com public/sw.js).
export const APP_NAME = 'RealPayz'
export const NOTIFICATION_ICON = '/notification-icon-192.png'
export const NOTIFICATION_BADGE = '/notification-badge-96.png'
export const VAPID_CONTACT = 'mailto:suporte@realpayz.app'

export type AccessType = 'FREE' | 'VIP'

interface RemarketingStep {
  /** Minutos após a criação da conta em que a mensagem fica elegível. */
  afterMinutes: number
  tag: string
  free: (name: string) => string
  vip: (name: string) => string
}

// Sequência enviada a todos os utilizadores. Cada passo só sai uma vez,
// na primeira execução do cron depois de o tempo mínimo passar.
export const REMARKETING_SEQUENCE: RemarketingStep[] = [
  {
    afterMinutes: 0,
    tag: 'realpayz-welcome',
    free: (n) => `Parabéns, ${n}! Sua conta foi aprovada. Conclua os passos e use o Pix sem limites.`,
    vip: (n) => `Parabéns, ${n}! Sua conta Pro está ativa. Crie sua chave e comece a receber Pix agora.`,
  },
  {
    afterMinutes: 120,
    tag: 'realpayz-step-1',
    free: (n) => `Hey ${n}, ative sua conta hoje e comece a receber Pix agora.`,
    vip: (n) => `Hey ${n}, sua chave Pix já pode receber. Faça seu primeiro Pix hoje.`,
  },
  {
    afterMinutes: 24 * 60,
    tag: 'realpayz-step-2',
    free: (n) => `${n}, sua conta está quase pronta. Ative o modo Pro e libere Pix, chaves e levantamentos.`,
    vip: (n) => `${n}, seus Pix caem direto na sua carteira. Compartilhe sua chave e comece a receber.`,
  },
  {
    afterMinutes: 3 * 24 * 60,
    tag: 'realpayz-step-3',
    free: (n) => `${n}, já tem gente recebendo Pix hoje pelo RealPayz. Ative sua conta e não fique de fora.`,
    vip: (n) => `${n}, ainda sem movimentações? Faça seu primeiro Pix e veja o saldo cair na hora.`,
  },
  {
    afterMinutes: 7 * 24 * 60,
    tag: 'realpayz-step-4',
    free: (n) => `Última chamada, ${n}: ative sua conta RealPayz e comece a receber Pix em minutos.`,
    vip: (n) => `${n}, sua conta Pro continua ativa. Volte e receba seu Pix sem limites.`,
  },
]

export function displayFirstName(name?: string | null) {
  const firstName = (name || '').trim().split(/\s+/)[0]
  return firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() : 'Cliente'
}

export function buildRemarketingPayload(step: number, name?: string | null, accessType?: string | null) {
  const config = REMARKETING_SEQUENCE[Math.min(step, REMARKETING_SEQUENCE.length - 1)]
  const firstName = displayFirstName(name)
  const body = accessType === 'VIP' ? config.vip(firstName) : config.free(firstName)

  return JSON.stringify({
    title: APP_NAME,
    body,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    tag: config.tag,
    data: { url: APP_URL, step },
  })
}

/** Payload da primeira mensagem ("conta aprovada"). */
export function buildWelcomePushPayload(name?: string | null, accessType?: string | null) {
  return buildRemarketingPayload(0, name, accessType)
}

/**
 * Devolve o índice do próximo passo que deve ser enviado para um utilizador,
 * ou null se nada está pendente. Determinístico: baseia-se só em created_at e
 * na data do último envio, sem precisar de coluna extra na tabela.
 */
export function nextRemarketingStep(createdAt: string, lastSentAt: string | null, now = Date.now()) {
  const created = new Date(createdAt).getTime()
  const lastSent = lastSentAt ? new Date(lastSentAt).getTime() : null
  const ageMinutes = (now - created) / 60_000

  let due: number | null = null
  for (let i = 0; i < REMARKETING_SEQUENCE.length; i++) {
    const step = REMARKETING_SEQUENCE[i]
    if (ageMinutes < step.afterMinutes) break
    const eligibleAt = created + step.afterMinutes * 60_000
    // O passo já foi enviado se o último envio aconteceu depois de ele ficar elegível.
    if (lastSent === null || lastSent < eligibleAt) due = i
  }
  return due
}
