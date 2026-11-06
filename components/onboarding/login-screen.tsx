'use client'

import { useState } from 'react'
import { DotsLoader } from '@/components/ui/dots-loader'
import { StepShell, UnderlineInput, PinField, PrimaryButton, GhostButton, BrandMark } from './ui'
import { PhoneInput, usePhoneCountry } from './phone-input'
import { accountPhone, validPhone } from '@/lib/phone-country'
import { accessSchoolAccount } from '@/lib/school-account-client'
import type { StoredUser } from '@/lib/stored-user'
import { loadStoredUser } from '@/lib/stored-user'
import { analytics } from '@/lib/analytics'

interface LoginScreenProps {
  onBack: () => void
  onCreateAccount: () => void
  onLogin: (user: StoredUser) => void
}

export function LoginScreen({ onBack, onCreateAccount, onLogin }: LoginScreenProps) {
  const [phone, setPhone] = useState('')
  const { country, changeCountry, markEdited } = usePhoneCountry()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  const digits = accountPhone(phone, country)
  const canSubmit = validPhone(phone, country) && pin.length === 6

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)

    setConnecting(true)
    try {
      const legacy = loadStoredUser(digits) || undefined
      const [user] = await Promise.all([
        accessSchoolAccount(digits, pin, legacy),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ])
      analytics.login()
      onLogin(user)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível entrar.')
      setPin('')
      setConnecting(false)
    }
  }

  if (connecting) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 bg-background px-8 text-center animate-fade-in">
        <DotsLoader size={16} className="text-primary" />
        <div className="flex flex-col gap-2">
          <p className="text-xl font-bold text-foreground">Conexão segura</p>
          <p className="text-pretty text-muted-foreground">Autenticando o seu dispositivo...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <StepShell
        stepKey="login"
        onBack={onBack}
        title="Bem-vindo de volta"
        subtitle="Entre com o número de celular e a senha de 6 dígitos do app."
        footer={
          <>
            <PrimaryButton type="submit" disabled={!canSubmit}>
              Entrar
            </PrimaryButton>
            <GhostButton onClick={onCreateAccount}>Criar uma conta</GhostButton>
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <div className="-mt-2">
            <BrandMark size="sm" />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="login-phone" className="text-sm font-medium text-muted-foreground">
              Número de celular
            </label>
            <PhoneInput id="login-phone" country={country} value={phone}
              onCountryChange={(code) => { changeCountry(code); setPhone('') }}
              onChange={(value) => { markEdited(); setPhone(value) }} />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-muted-foreground">Senha de 6 dígitos</span>
            <PinField length={6} value={pin} onChange={setPin} label="Senha de acesso" error={Boolean(error)} />
          </div>

          {error ? (
            <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </StepShell>
    </form>
  )
}
