export const PHONE_COUNTRIES = [
  { code: 'MZ', name: 'Moçambique', dial: '258', length: 9, placeholder: '84 000 0000' },
  { code: 'AO', name: 'Angola', dial: '244', length: 9, placeholder: '923 000 000' },
  { code: 'CV', name: 'Cabo Verde', dial: '238', length: 7, placeholder: '991 00 00' },
] as const
export type PhoneCountry = (typeof PHONE_COUNTRIES)[number]
export function phoneCountry(code: string): PhoneCountry {
  return PHONE_COUNTRIES.find((country) => country.code === code) ?? PHONE_COUNTRIES[0]
}
export function validPhone(value: string, country: PhoneCountry): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length === country.length && (country.code === 'MZ' ? /^8[2-7]/.test(digits) : /^[2-9]/.test(digits))
}
// Keep existing Mozambique account keys compatible; qualify other countries.
export function accountPhone(value: string, country: PhoneCountry): string {
  const digits = value.replace(/\D/g, '')
  return country.code === 'MZ' ? digits : country.dial + digits
}
