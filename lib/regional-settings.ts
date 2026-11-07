import { PROVINCES, MOBILE_WALLETS } from './onboarding-format'
import { PHONE_COUNTRIES, type PhoneCountry } from './phone-country'

export type CountryCode = PhoneCountry['code']
export interface PaymentPreference {
  id: string
  name: string
  operator: string
  logo?: string
  monogram?: string
  color?: string
}
export interface RegionalSettings {
  code: CountryCode
  currency: 'MZN' | 'AOA' | 'CVE'
  symbol: string
  currencyName: string
  locale: string
  regionLabel: string
  regionQuestion: string
  regions: readonly string[]
  methods: readonly PaymentPreference[]
  walletSummary: string
}

export const REGIONAL_SETTINGS: Record<CountryCode, RegionalSettings> = {
  MZ: {
    code: 'MZ', currency: 'MZN', symbol: 'MT', currencyName: 'meticais', locale: 'pt-MZ',
    regionLabel: 'Província', regionQuestion: 'Qual é a sua província?', regions: PROVINCES,
    methods: MOBILE_WALLETS,
    walletSummary: 'M-Pesa, e-Mola e mKesh',
  },
  AO: {
    code: 'AO', currency: 'AOA', symbol: 'Kz', currencyName: 'kwanzas', locale: 'pt-AO',
    regionLabel: 'Província', regionQuestion: 'Qual é a sua província?',
    // Current administrative division: 21 provinces, effective January 2025.
    regions: ['Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando', 'Cuanza Norte', 'Cuanza Sul',
      'Cubango', 'Cunene', 'Huambo', 'Huíla', 'Icolo e Bengo', 'Luanda', 'Lunda Norte',
      'Lunda Sul', 'Malanje', 'Moxico', 'Moxico Leste', 'Namibe', 'Uíge', 'Zaire'],
    methods: [
      { id: 'multicaixa-express', name: 'MULTICAIXA Express', operator: 'Rede MULTICAIXA', logo: '/images/wallets/multicaixa-express.png', color: '#ed8000' },
      { id: 'unitel-money', name: 'UNITEL Money', operator: 'UNITEL', logo: '/images/wallets/unitel-money.svg', monogram: 'U', color: '#ed6b22' },
      { id: 'afrimoney', name: 'Afrimoney', operator: 'Africell', monogram: 'a', color: '#773d91' },
    ],
    walletSummary: 'MULTICAIXA Express, UNITEL Money e Afrimoney',
  },
  CV: {
    code: 'CV', currency: 'CVE', symbol: 'CVE', currencyName: 'escudos cabo-verdianos', locale: 'pt-CV',
    regionLabel: 'Ilha', regionQuestion: 'Em que ilha vive?',
    // Santa Luzia is uninhabited; list the nine inhabited islands for residence.
    regions: ['Boa Vista', 'Brava', 'Fogo', 'Maio', 'Sal', 'Santiago', 'Santo Antão', 'São Nicolau', 'São Vicente'],
    methods: [
      { id: 'televinti4', name: 'televinti4', operator: 'Rede vinti4', monogram: 'v4', color: '#13659b' },
      { id: 'bank-transfer-cv', name: 'Transferência bancária', operator: 'Conta bancária', monogram: 'CV', color: '#165e55' },
    ],
    walletSummary: 'televinti4 e transferência bancária',
  },
}

export function getRegionalSettings(code?: string | null): RegionalSettings {
  return REGIONAL_SETTINGS[code as CountryCode] ?? REGIONAL_SETTINGS.MZ
}

export function countryFromPhone(phone: string): CountryCode {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('244') && digits.length === 12) return 'AO'
  if (digits.startsWith('238') && digits.length === 10) return 'CV'
  return 'MZ'
}

export function supportedCountry(value: unknown): value is CountryCode {
  return PHONE_COUNTRIES.some((country) => country.code === value)
}

// Illustrative rates for the school simulation; not market quotations.
export const DEMO_BRL_RATES = { MZN: 14, AOA: 160, CVE: 20 } as const
export function convertDemoBRL(value: number, currency: RegionalSettings['currency']) {
  return value * DEMO_BRL_RATES[currency]
}
export function formatLocalAmount(value: number, currency: RegionalSettings['currency']) {
  const settings = Object.values(REGIONAL_SETTINGS).find((item) => item.currency === currency)!
  return `${new Intl.NumberFormat(settings.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${settings.symbol}`
}
export function walletPhoneError(digits: string, walletId: string | null, country: CountryCode): string | null {
  if (!walletId || digits.length < 2) return null
  if (country === 'AO') return digits.startsWith('9') ? null : 'Use um número de Angola que começa com 9.'
  if (country !== 'MZ') return null
  const prefixes: Record<string, string[]> = { mpesa: ['84', '85'], emola: ['86', '87'], mkesh: ['82', '83'] }
  const allowed = prefixes[walletId]
  if (!allowed || allowed.includes(digits.slice(0, 2))) return null
  const method = REGIONAL_SETTINGS.MZ.methods.find((item) => item.id === walletId)
  return `Números ${method?.name} começam com ${allowed.join(' ou ')}.`
}
