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
}
