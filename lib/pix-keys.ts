import type { PixKey } from '@/lib/store'

const digit = () => Math.floor(Math.random() * 10)

// CPF com 11 dígitos no formato xxx.xxx.xxx-xx
export function generatePixCPF(): string {
  const d = Array.from({ length: 11 }, digit).join('')
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

// Celular brasileiro: (11) 9xxxx-xxxx com DDD 11, 19 ou 21
export function generatePixCelular(): string {
  const ddd = ['11', '19', '21'][Math.floor(Math.random() * 3)]
  const rest = Array.from({ length: 8 }, digit).join('')
  return `(${ddd}) 9${rest.slice(0, 4)}-${rest.slice(4)}`
}

// Chave aleatória alfanumérica de 32 caracteres
export function generatePixRandomKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export const PIX_KEY_TYPES: { id: PixKey['type']; label: string; hint: string }[] = [
  { id: 'cpf', label: 'CPF', hint: 'Gerado automaticamente' },
  { id: 'celular', label: 'Celular', hint: 'Número brasileiro gerado' },
  { id: 'email', label: 'E-mail', hint: 'Você informa o seu e-mail' },
  { id: 'aleatorio', label: 'Chave aleatória', hint: 'Código de 32 caracteres' },
]

export function pixKeyTypeLabel(type: PixKey['type']): string {
  return PIX_KEY_TYPES.find((t) => t.id === type)?.label ?? type
}
