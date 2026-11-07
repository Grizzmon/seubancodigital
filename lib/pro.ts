import type { PixKey } from '@/lib/store'

// URLs originais / padrão
export const PRO_ACTIVATION_URL = 'https://loteriasegredo.com/ativerealpayz'
export const GENERAL_KEY_ACTIVATION_URL = 'https://pay.tutora.co.mz/e6cc1edc66244aa7b142f8049459b73b'
export const UPGRADE_PLAN_URL = 'https://fap-planos.vercel.app'

// URL específica para Angola
export const ANGOLA_PRO_ACTIVATION_URL = 'https://loteriasegredo.com/ativeseurealpay/'

export type Plan = 'free' | 'pro'

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

// Usa primeiro a escolha do seletor existente e o país do cadastro.
// Não deduz o país a partir do fuso horário ou idioma.
type ActivationCountry = 'AO' | 'MZ'

function validActivationCountry(value: unknown): ActivationCountry | null {
  return value === 'AO' || value === 'MZ' ? value : null
}

function savedActivationCountry(): ActivationCountry | null {
  if (typeof window === 'undefined') return null
  try {
    const selected = validActivationCountry(localStorage.getItem('realpayz_country'))
    if (selected) return selected

    for (const key of ['realpayz_session_phone', 'realpayz_last_account_phone']) {
      const phone = localStorage.getItem(key)
      if (!phone) continue
      const stored = localStorage.getItem('bankpix_user_' + phone.replace(/\\D/g, ''))
      if (!stored) continue
      const user = JSON.parse(stored) as { countryCode?: string }
      const accountCountry = validActivationCountry(user.countryCode)
      if (accountCountry) return accountCountry
    }
  } catch {
    // Um dado local inválido não deve causar encaminhamento errado.
  }
  return null
}

export function isAngolaUser(countryCode?: string): boolean {
  return (validActivationCountry(countryCode) ?? savedActivationCountry()) === 'AO'
}

async function resolveActivationCountry(countryCode?: string): Promise<ActivationCountry | null> {
  const explicit = validActivationCountry(countryCode)
  if (explicit) return explicit

  const saved = savedActivationCountry()
  if (saved) return saved

  // O endpoint já existe no projeto. detectedCountry não assume MZ
  // quando a Vercel não fornece uma localização válida.
  let suggested: ActivationCountry | null = null
  try {
    const response = await fetch('/api/phone-country', { cache: 'no-store' })
    if (response.ok) {
      const data = await response.json() as { detectedCountry?: string | null }
      suggested = validActivationCountry(data.detectedCountry)
    }
  } catch {
    // Sem IP, o utilizador escolhe manualmente.
  }

  const answer = window.prompt(
    'Confirme o seu país para abrir o link correto:\\n1 - Angola\\n2 - Moçambique',
    suggested === 'AO' ? '1' : suggested === 'MZ' ? '2' : ''
  )
  if (answer === null) return null
  const choice = answer.trim().toUpperCase()
  const selected = choice === '1' || choice === 'AO' ? 'AO'
    : choice === '2' || choice === 'MZ' ? 'MZ' : null

  if (!selected) {
    window.alert('Escolha 1 para Angola ou 2 para Moçambique.')
    return null
  }

  try {
    localStorage.setItem('realpayz_country', selected)
  } catch {
    // A seleção vale para o clique atual mesmo sem armazenamento.
  }
  return selected
}

export async function openProActivation(countryCode?: string) {
  const country = await resolveActivationCountry(countryCode)
  if (!country) return
  openExternal(country === 'AO' ? ANGOLA_PRO_ACTIVATION_URL : PRO_ACTIVATION_URL)
}

export function openGeneralKeyActivation() {
  openExternal(GENERAL_KEY_ACTIVATION_URL)
}

export async function openUpgradePlan(countryCode?: string) {
  const country = await resolveActivationCountry(countryCode)
  if (!country) return
  openExternal(country === 'AO' ? ANGOLA_PRO_ACTIVATION_URL : UPGRADE_PLAN_URL)
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
