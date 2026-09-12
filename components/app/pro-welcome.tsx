'use client'

import { useEffect } from 'react'
import { BadgeCheck, KeyRound, Wallet, Banknote, ArrowRight, Sparkles } from 'lucide-react'
import { PixSymbol } from './pix-symbol'
import { analytics } from '@/lib/analytics'
import { capitalizeWords, firstName } from '@/lib/onboarding-format'

interface ProWelcomeProps {
  userName: string
  onContinue: () => void
}

const BENEFITS = [
  { icon: <KeyRound className="h-6 w-6" />, label: 'Chaves Pix ativas e totalmente visíveis' },
  { icon: <PixSymbol className="h-6 w-6" />, label: 'Pix ativo para receber do Brasil' },
  { icon: <Wallet className="h-6 w-6" />, label: 'M-Pesa, e-Mola e mKesh vinculadas' },
  { icon: <Banknote className="h-6 w-6" />, label: 'Levantamento para carteiras locais' },
]

export function ProWelcome({ userName, onContinue }: ProWelcomeProps) {
  useEffect(() => {
    analytics.proWelcomeViewed()
  }, [])

  const name = capitalizeWords(firstName(userName)) || 'Cliente'

  return (
    <div className="flex min-h-dvh flex-col bg-brand-gradient text-primary-foreground animate-fade-in">
      <main className="flex flex-1 flex-col justify-center gap-8 px-6 py-12">
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-background text-primary shadow-xl animate-pop-in">
            <BadgeCheck className="h-12 w-12" strokeWidth={2.2} />
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-success ring-4 ring-primary">
              <span className="h-3 w-3 rounded-full bg-background" />
            </span>
          </span>
          <div className="flex flex-col gap-2">
            <span className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary-foreground/80 animate-fade-in [animation-delay:200ms]">
              <Sparkles className="h-4 w-4" /> Modo Pro ativado
            </span>
            <h1 className="text-balance text-3xl font-bold leading-tight animate-step-forward">
              Boas-vindas ao modo Pro, {name}!
            </h1>
            <p className="text-pretty text-base leading-relaxed text-primary-foreground/85 animate-fade-in [animation-delay:400ms]">
              Sua conta está ativa e todas as funcionalidades foram liberadas. Veja o que já pode usar agora.
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {BENEFITS.map((item, i) => (
            <li
              key={item.label}
              className="flex items-center gap-4 rounded-2xl bg-background/12 px-4 py-3.5 backdrop-blur-sm animate-pop-in"
              style={{ animationDelay: `${600 + i * 180}ms` }}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-primary">
                {item.icon}
              </span>
              <span className="text-base font-semibold">{item.label}</span>
            </li>
          ))}
        </ul>
      </main>

      <footer className="flex flex-col gap-3 px-6 pb-8">
        <button
          type="button"
          onClick={onContinue}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-background text-base font-bold text-primary shadow-lg transition-transform active:scale-[0.98] animate-pop-in [animation-delay:1400ms]"
        >
          Começar a usar <ArrowRight className="h-5 w-5" />
        </button>
      </footer>
    </div>
  )
}
