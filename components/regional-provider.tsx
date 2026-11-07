'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { phoneCountry, type PhoneCountry } from '@/lib/phone-country'
import { countryFromPhone, getRegionalSettings, supportedCountry } from '@/lib/regional-settings'
import { loadRememberedUser } from '@/lib/stored-user'

const COUNTRY_KEY = 'realpayz_country'
const RegionContext = createContext({
  country: phoneCountry('MZ'),
  changeCountry: (_code: string) => {},
  markEdited: () => {},
})

export function RegionalProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<PhoneCountry>(phoneCountry('MZ'))
  const edited = useRef(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    function restoreCountry() {
      const manual = localStorage.getItem(COUNTRY_KEY)
      if (supportedCountry(manual)) {
        edited.current = true
        setCountry(phoneCountry(manual))
        return true
      }
      const user = loadRememberedUser()
      const accountCountry = user?.countryCode || (user ? countryFromPhone(user.phone) : null)
      if (!edited.current && supportedCountry(accountCountry)) {
        setCountry(phoneCountry(accountCountry))
        return true
      }
      return false
    }
    const onAccount = () => {
      if (restoreCountry()) { controller.abort(); clearTimeout(timer); setReady(true) }
    }
    window.addEventListener('bankpix-user-ready', onAccount)
    if (restoreCountry()) setReady(true)
    else {
      timer = setTimeout(() => controller.abort(), 4000)
      fetch('/api/phone-country', { cache: 'no-store', signal: controller.signal })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => { if (!cancelled && !edited.current && supportedCountry(data?.country) && !restoreCountry()) setCountry(phoneCountry(data.country)) })
        .catch(() => {})
        .finally(() => { clearTimeout(timer); if (!cancelled) setReady(true) })
    }
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
      window.removeEventListener('bankpix-user-ready', onAccount)
    }
  }, [])
  const changeCountry = (code: string) => {
    if (!supportedCountry(code)) return
    edited.current = true
    setCountry(phoneCountry(code))
    localStorage.setItem(COUNTRY_KEY, code)
  }
  if (!ready) return <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground" role="status">A preparar o RealPayz…</div>
  return <RegionContext.Provider value={{ country, changeCountry, markEdited: () => { edited.current = true } }}>{children}</RegionContext.Provider>
}

export function useRegionalCountry() { return useContext(RegionContext) }
export function useRegionalSettings() { return getRegionalSettings(useRegionalCountry().country.code) }

export function CountrySelector() {
  const { country, changeCountry } = useRegionalCountry()
  return (
    <label className="flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 text-sm font-semibold text-foreground shadow-sm">
      <img src={`/flags/${country.code.toLowerCase()}.svg`} alt="" width={24} height={17} className="h-4 w-6 rounded-sm object-cover" />
      <span className="sr-only">País do cadastro</span>
      <select value={country.code} onChange={(event) => changeCountry(event.target.value)} className="min-w-0 bg-transparent outline-none">
        <option value="MZ">Moçambique</option><option value="AO">Angola</option><option value="CV">Cabo Verde</option>
      </select>
    </label>
  )
}

export function RegionBadge() {
  const { country } = useRegionalCountry()
  const regional = useRegionalSettings()
  return <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">
    <img src={`/flags/${country.code.toLowerCase()}.svg`} alt="" width={24} height={17} className="h-4 w-6 rounded-sm object-cover" />
    {country.name}<span className="text-muted-foreground">· {regional.symbol}</span>
  </div>
}
