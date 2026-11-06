import type { PixKey, Transaction } from '@/lib/store'

// Perfil do usuário guardado no aparelho. A chave mantém o prefixo antigo
// para que contas criadas antes do redesign continuem entrando.
export interface StoredUser {
  name: string
  phone: string
  email?: string
  password: string
  transactionPin?: string
  birthDate?: string
  motherName?: string
  province?: string
  countryCode?: 'MZ' | 'AO' | 'CV'
  incomeCurrency?: 'MZN' | 'AOA' | 'CVE'
  regionType?: string
  monthlyIncome?: number
  occupation?: string
  documentType?: string
  wallets?: string[]
  reasons?: string[]
  balance: number
  income: number
  keys: PixKey[]
  transactions: Transaction[]
}

const KEY_PREFIX = 'bankpix_user_'

export function storageKeyFor(phone: string): string {
  return `${KEY_PREFIX}${phone.replace(/\D/g, '')}`
}

export function loadStoredUser(phone: string): StoredUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(storageKeyFor(phone))
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function saveStoredUser(user: StoredUser): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(storageKeyFor(user.phone), JSON.stringify(user))
  localStorage.setItem('realpayz_last_account_phone', user.phone)
}

// Logout ends the session, while the saved account remains available for login.
export function loadRememberedUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  for (const key of ['realpayz_session_phone', 'realpayz_last_account_phone']) {
    const phone = localStorage.getItem(key)
    const user = phone ? loadStoredUser(phone) : null
    if (user?.name && user.phone && typeof user.password === 'string') return user
  }
  // Migrate older installations only when a single saved account is unambiguous.
  const users: StoredUser[] = []
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index)
    if (!key || !/^bankpix_user_\d+$/.test(key)) continue
    try {
      const user = JSON.parse(localStorage.getItem(key) || 'null') as StoredUser | null
      if (user?.name && user.phone && typeof user.password === 'string') users.push(user)
    } catch { /* Ignore unrelated or incomplete local records. */ }
  }
  if (users.length !== 1) return null
  localStorage.setItem('realpayz_last_account_phone', users[0].phone)
  return users[0]
}
