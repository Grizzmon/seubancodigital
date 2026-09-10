import { track } from '@vercel/analytics'

type EventProps = Record<string, string | number | boolean>

type Fbq = (action: 'track' | 'trackCustom', name: string, params?: EventProps) => void

function getFbq(): Fbq | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { fbq?: Fbq }).fbq
}

/**
 * Envia o mesmo evento para o Vercel Analytics (aba "Events" no painel)
 * e para o Meta Pixel, para o funil aparecer nos dois lugares.
 */
function send(name: string, props: EventProps = {}, meta?: { standard?: string }) {
  track(name, props)
  const fbq = getFbq()
  if (!fbq) return
  if (meta?.standard) {
    fbq('track', meta.standard, { content_name: name, ...props })
  } else {
    fbq('trackCustom', name, props)
  }
}

/** Funil de cadastro, na ordem em que acontece no app. */
export const analytics = {
  /** Clicou em "Criar conta" na tela inicial. */
  signupStarted: () => send('signup_started'),

  /** Preencheu o número de celular (primeiro dado). */
  signupPhone: () => send('signup_phone'),

  /** Aceitou a política: lead qualificado (nome, e-mail e celular). */
  leadCadastro: () => send('lead_cadastro', {}, { standard: 'Lead' }),

  /** Conta criada no servidor (tela "Cadastro aprovado"). */
  signupApproved: () => send('signup_approved', {}, { standard: 'CompleteRegistration' }),

  /** Documento enviado e conta aberta com sucesso. */
  accountOpened: () => send('account_opened'),

  /** Abandonou o cadastro; `step` diz em que tela desistiu. */
  signupAbandoned: (step: string) => send('signup_abandoned', { step }),

  /** Concluiu o cadastro inteiro e entrou no app. */
  signupCompleted: () => send('signup_completed'),

  /** Entrou com uma conta já existente. */
  login: () => send('login'),

  /** Viu a apresentação Pro. */
  proIntroViewed: (source: string) => send('pro_intro_viewed', { source }),

  /** Clicou em "Quero Ativar" (saiu para o link de ativação). */
  proActivateClicked: () => send('pro_activate_clicked', {}, { standard: 'InitiateCheckout' }),

  /** Tentou usar uma função bloqueada (não Pro). */
  proGateShown: (feature: string) => send('pro_gate_shown', { feature }),

  /** Cadastrou uma chave Pix. */
  pixKeyCreated: (type: string) => send('pix_key_created', { type }),

  /** Iniciou levantamento para carteira móvel. */
  withdrawStarted: (wallet: string) => send('withdraw_started', { wallet }),
}
