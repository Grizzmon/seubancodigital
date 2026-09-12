'use client'

import { useEffect, useState } from 'react'
import { X, ShieldAlert, ShieldCheck, ExternalLink, Landmark } from 'lucide-react'
import { PrimaryButton } from '@/components/onboarding/ui'
import { openGeneralKeyActivation } from '@/lib/pro'
import { analytics } from '@/lib/analytics'

interface KeyActivationSheetProps {
  open: boolean
  onClose: () => void
}

const BANKS = ['Nubank', 'Itaú', 'Caixa', 'Santander', 'Bradesco', 'C6', 'PicPay', 'Inter']

// Aviso em duas etapas: explica o pacote GO e leva para a ativação geral das chaves.
export function KeyActivationSheet({ open, onClose }: KeyActivationSheetProps) {
  const [step, setStep] = useState<'info' | 'confirm'>('info')

  useEffect(() => {
    if (!open) return
    setStep('info')
    analytics.keyIssueOpened()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleActivate = () => {
    analytics.generalKeyActivationClicked()
    openGeneralKeyActivation()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="key-activation-title">
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-foreground/50 animate-fade-in" />
      <div className="relative w-full max-w-md rounded-t-3xl bg-card px-6 pb-8 pt-5 shadow-2xl animate-sheet-up">
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-border" aria-hidden />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        {step === 'info' ? (
          <div key="info" className="flex flex-col gap-6 animate-step-forward">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary animate-pop-in">
                <ShieldAlert className="h-8 w-8" />
              </span>
              <div className="flex flex-col gap-2">
                <h2 id="key-activation-title" className="text-balance text-2xl font-bold">
                  Bancos não reconhecem minhas chaves
                </h2>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  Em algumas contas do <strong className="font-semibold text-foreground">pacote GO</strong> é normal que
                  algumas instituições não reconheçam as suas chaves. Para isso será necessário fazer a{' '}
                  <strong className="font-semibold text-foreground">ativação geral da chave</strong>, para todas as
                  instituições do Brasil reconhecerem as suas chaves e poderem enviar Pix para elas.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <PrimaryButton onClick={() => setStep('confirm')}>
                <ShieldCheck className="h-5 w-5" /> Fazer ativação geral
              </PrimaryButton>
              <button type="button" onClick={onClose} className="h-11 text-sm font-semibold text-muted-foreground">
                Agora não
              </button>
            </div>
          </div>
        ) : (
          <div key="confirm" className="flex flex-col gap-6 animate-step-forward">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success animate-pop-in">
                <Landmark className="h-8 w-8" />
              </span>
              <div className="flex flex-col gap-2">
                <h2 className="text-balance text-2xl font-bold">Chaves funcionais em qualquer instituição</h2>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  Ao ativar, você terá suas chaves totalmente funcionais e operacionais em qualquer instituição do Brasil.
                </p>
              </div>
            </div>

            <ul className="flex flex-wrap justify-center gap-2" aria-label="Instituições compatíveis">
              {BANKS.map((bank, i) => (
                <li
                  key={bank}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground/80 animate-fade-in"
                  style={{ animationDelay: `${120 + i * 60}ms` }}
                >
                  {bank}
                </li>
              ))}
              <li className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">e mais</li>
            </ul>

            <div className="flex flex-col gap-3">
              <PrimaryButton onClick={handleActivate}>
                <ShieldCheck className="h-5 w-5" /> Ativar chave geral
                <ExternalLink className="h-4 w-4 opacity-70" />
              </PrimaryButton>
              <p className="text-center text-xs text-muted-foreground">Você será levado para a página de ativação segura.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
