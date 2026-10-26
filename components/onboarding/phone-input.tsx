'use client'

import { useEffect, useRef, useState } from 'react'
import { UnderlineInput } from './ui'
import { PHONE_COUNTRIES, phoneCountry, type PhoneCountry } from '@/lib/phone-country'

export function usePhoneCountry() {
  const [country, setCountry] = useState<PhoneCountry>(PHONE_COUNTRIES[0])
  const edited = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    fetch('/api/phone-country', { cache: 'no-store', signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data && !edited.current) setCountry(phoneCountry(data.country)) })
      .catch(() => {})
      .finally(() => clearTimeout(timer))
    return () => { controller.abort(); clearTimeout(timer) }
  }, [])
  return { country, changeCountry: (code: string) => { edited.current = true; setCountry(phoneCountry(code)) },
    markEdited: () => { edited.current = true } }
}

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
