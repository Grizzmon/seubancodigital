import type { PixKey } from '@/lib/store'

export const PRO_ACTIVATION_URL = 'https://loteriasegredo.com/ativerealpayz'

export function openProActivation() {
  window.open(PRO_ACTIVATION_URL, '_blank', 'noopener,noreferrer')
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
