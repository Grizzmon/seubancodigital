'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { StepShell, UnderlineInput, PinField, PrimaryButton, GhostButton, BrandMark } from './ui'
import { formatMozPhone, isValidMozPhone } from '@/lib/onboarding-format'
import { registerUserAndLinkPush } from '@/lib/register-user'
import type { StoredUser } from '@/lib/stored-user'
import { loadStoredUser } from '@/lib/stored-user'

interface LoginScreenProps {
  onBack: () => void
  onCreateAccount: () => void
  onLogin: (user: StoredUser) => void
}

export function LoginScreen({ onBack, onCreateAccount, onLogin }: LoginScreenProps) {
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  const digits = phone.replace(/\D/g, '')
  const canSubmit = isValidMozPhone(digits) && pin.length === 6

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)

    const user = loadStoredUser(digits)
    if (!user) {
      setError('Não encontramos uma conta com este número. Crie a sua conta em poucos passos.')
      return
    }
    if (user.password !== pin) {
      setError('Senha incorreta. Verifique os 6 dígitos e tente novamente.')
      setPin('')
      return
    }

    setConnecting(true)
    const params = new URLSearchParams(window.location.search)
    const isVip = params.get('acesso') === 'vip' || params.get('plano') === 'vip'

    await Promise.all([
      registerUserAndLinkPush({ name: user.name, phone: digits, accessType: isVip ? 'VIP' : 'FREE', newAccount: false }),
      new Promise((r) => setTimeout(r, 2200)),
    ])

    onLogin(user)
  }

  if (connecting) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 bg-background px-8 text-center animate-fade-in">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-4 border-accent" />
          <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
          <ShieldCheck className="relative h-8 w-8 text-primary" />
        </div>
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
            <div className="flex items-end gap-3">
              <span className="border-b-2 border-border py-3 text-2xl font-semibold text-muted-foreground">+258</span>
              <UnderlineInput
                id="login-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="84 000 0000"
                value={formatMozPhone(phone)}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
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
