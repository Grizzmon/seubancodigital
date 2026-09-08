export const PROVINCES = [
  'Maputo Cidade',
  'Maputo Província',
  'Gaza',
  'Inhambane',
  'Sofala',
  'Manica',
  'Tete',
  'Zambézia',
  'Nampula',
  'Cabo Delgado',
  'Niassa',
] as const

export const LEAD_REASONS = [
  'Guardar e movimentar meu dinheiro',
  'Fazer depósitos e saques na Carteira Móvel',
  'Fazer transações e Pix internacional',
  'Compras online e pagamentos',
  'Recomendação de amigo',
] as const

export const OCCUPATIONS = [
  'Estudante',
  'Trabalhador Independente / Freelancer',
  'Empregado do Setor Privado',
  'Funcionário Público',
  'Comerciante / Empreendedor',
  'Outro',
] as const

export const DOCUMENT_TYPES = [
  { id: 'bi', label: 'Documento de Identidade (BI)', recommended: true },
  { id: 'carta', label: 'Carta de Condução', recommended: false },
  { id: 'passaporte', label: 'Passaporte', recommended: false },
] as const

export const MOBILE_WALLETS = [
  { id: 'mpesa', name: 'M-Pesa', operator: 'Vodacom', logo: '/images/wallets/mpesa.png' },
  { id: 'emola', name: 'e-Mola', operator: 'Movitel', logo: '/images/wallets/emola.png' },
  { id: 'mkesh', name: 'mKesh', operator: 'Tmcel', logo: '/images/wallets/mkesh.png' },
] as const

export function formatMozPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
}

export function isValidMozPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  return digits.length === 9 && /^8[2-7]/.test(digits)
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

// Insere as barras automaticamente: DD/MM/AAAA
export function formatBirthDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function isValidBirthDate(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return false
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false
  const now = new Date()
  const age = now.getFullYear() - year - (now < new Date(now.getFullYear(), month - 1, day) ? 1 : 0)
  return age >= 16 && age <= 110
}

// Valor monetário em meticais digitado como centavos: "12.500,00"
export function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12)
  if (!digits) return ''
  const cents = digits.padStart(3, '0')
  const integer = cents.slice(0, -2)
  const fraction = cents.slice(-2)
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fraction}`
}

export function currencyInputToNumber(value: string): number {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) / 100 : 0
}

export function capitalizeWords(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || ''
}
