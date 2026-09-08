'use client'

import { useEffect } from 'react'
import { Lock, Sparkles, Check, X, Timer } from 'lucide-react'
import { PrimaryButton } from '@/components/onboarding/ui'

export type ProGateVariant = 'feature' | 'keys' | 'more-keys'

interface ProGateSheetProps {
  open: boolean
  variant: ProGateVariant
  featureName?: string
  onClose: () => void
  onActivate: () => void
}

const PRO_FEATURES = [
  'Pix ativo para receber do Brasil',
  'Chaves Pix visíveis e prontas para uso',
  'Levantamento para M-Pesa, e-Mola e mKesh',
  'Crédito e cadastro de mais chaves',
]

export function ProGateSheet({ open, variant, featureName, onClose, onActivate }: ProGateSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const copy =
    variant === 'keys'
      ? {
          title: 'Suas chaves precisam de ativação',
          text: 'As chaves Pix ficam ocultas até a sua conta ser Pro. A ativação não leva mais de 1 minuto e depois elas ficam visíveis e prontas para uso.',
        }
      : variant === 'more-keys'
        ? {
            title: 'Cadastre mais chaves sendo Pro',
            text: 'A conta gratuita permite apenas uma chave. Ative o Pro para cadastrar CPF, celular e chave aleatória ao mesmo tempo.',
          }
        : {
            title: 'Você ainda não é Pro',
            text: `${featureName ?? 'Esta funcionalidade'} faz parte do plano Pro. Ative para liberar todas as funcionalidades da sua conta RealPayz.`,
          }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="pro-gate-title">
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

        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground animate-pop-in">
            {variant === 'feature' ? <Sparkles className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
          </span>
          <div className="flex flex-col gap-2">
            <h2 id="pro-gate-title" className="text-balance text-2xl font-bold">
              {copy.title}
            </h2>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{copy.text}</p>
          </div>
        </div>

        <ul className="mt-6 flex flex-col gap-2.5">
          {PRO_FEATURES.map((feature, i) => (
            <li
              key={feature}
              className="flex items-center gap-3 text-sm font-medium animate-fade-in"
              style={{ animationDelay: `${150 + i * 90}ms` }}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        {variant === 'keys' ? (
          <p className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-primary">
            <Timer className="h-4 w-4" /> Leva menos de 1 minuto
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          <PrimaryButton onClick={onActivate}>
            <Sparkles className="h-5 w-5" /> Ativar Pro
          </PrimaryButton>
          <button type="button" onClick={onClose} className="h-11 text-sm font-semibold text-muted-foreground">
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
