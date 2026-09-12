import type { PixKey } from '@/lib/store'

export const PRO_ACTIVATION_URL = 'https://loteriasegredo.com/ativerealpayz'
export const GENERAL_KEY_ACTIVATION_URL = 'https://pay.tutora.co.mz/e6cc1edc66244aa7b142f8049459b73b'
export const UPGRADE_PLAN_URL = 'https://fap-planos.vercel.app'

export type Plan = 'free' | 'pro'

// O plano fica guardado no aparelho: quem entra pelo link VIP (/vip) passa a ser Pro.
const PLAN_KEY = 'realpayz_plan'
const PRO_WELCOME_KEY = 'realpayz_pro_welcome_pending'

export function getPlan(): Plan {
  if (typeof window === 'undefined') return 'free'
  return localStorage.getItem(PLAN_KEY) === 'pro' ? 'pro' : 'free'
}

export function activateProPlan() {
  localStorage.setItem(PLAN_KEY, 'pro')
  localStorage.setItem(PRO_WELCOME_KEY, '1')
}

export function consumeProWelcome(): boolean {
  if (typeof window === 'undefined') return false
  const pending = localStorage.getItem(PRO_WELCOME_KEY) === '1'
  if (pending) localStorage.removeItem(PRO_WELCOME_KEY)
  return pending
}

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function openProActivation() {
  openExternal(PRO_ACTIVATION_URL)
}

export function openGeneralKeyActivation() {
  openExternal(GENERAL_KEY_ACTIVATION_URL)
}

export function openUpgradePlan() {
  openExternal(UPGRADE_PLAN_URL)
}

// Oculta parte da chave enquanto a conta não é Pro. Ex.: 123.456.***-78
export function maskPixKey(key: PixKey): string {
  const value = key.value
  switch (key.type) {
    case 'cpf':
      return value.replace(/^(\d{3}\.\d{3}\.)\d{3}(-\d{2})$/, '$1***$2')
    case 'celular':
      return value.replace(/^(\(\d{2}\) 9)\d{4}(-\d{4})$/, '$1****$2')
    case 'email': {
      const [user = '', domain = ''] = value.split('@')
      return `${user.slice(0, 2)}****@${domain}`
    }
    default:
      return `${value.slice(0, 6)}••••••••••••••••••${value.slice(-4)}`
  }
}
