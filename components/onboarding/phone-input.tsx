'use client'

import { UnderlineInput } from './ui'
import { PHONE_COUNTRIES, type PhoneCountry } from '@/lib/phone-country'

export { useRegionalCountry as usePhoneCountry } from '@/components/regional-provider'

export function PhoneInput({ country, onCountryChange, value, onChange, id, autoFocus = false }: {
  country: PhoneCountry; onCountryChange: (code: string) => void; value: string;
  onChange: (value: string) => void; id?: string; autoFocus?: boolean
}) {
  return (
    <div className="flex items-end gap-3">
      <div className="relative flex shrink-0 items-center gap-2 border-b-2 border-border py-3">
        {/* Image flags also render on Windows, where flag emoji may appear as letters. */}
        <img src={`/flags/${country.code.toLowerCase()}.svg`} alt={country.name} width={28} height={20} className="h-5 w-7 rounded-sm object-cover" />
        <span className="text-xl font-semibold text-muted-foreground">+{country.dial}</span>
        <select aria-label="País e indicativo" value={country.code} onChange={(event) => onCountryChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
          {PHONE_COUNTRIES.map((item) => <option key={item.code} value={item.code}>{item.name} (+{item.dial})</option>)}
        </select>
      </div>
      <UnderlineInput id={id} autoFocus={autoFocus} type="tel" inputMode="numeric" autoComplete="tel-national"
        placeholder={country.placeholder} aria-label="Número de celular" value={value}
        maxLength={country.length} onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, country.length))} />
    </div>
  )
}
