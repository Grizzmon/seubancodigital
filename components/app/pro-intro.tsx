'use client'

import { useEffect, useState } from 'react'
import { Users, Trophy, Globe, Wallet, KeyRound, Banknote, ArrowRight, Sparkles, ExternalLink } from 'lucide-react'
import { PrimaryButton } from '@/components/onboarding/ui'
import { PixSymbol } from './pix-symbol'
import { openProActivation } from '@/lib/pro'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/utils'

interface ProIntroProps {
  onClose: () => void
}

const STEPS = [
  {
    id: 'reach',
    eyebrow: 'Veja como ser Pro',
    title: 'Funcionalidades usadas por mais de 10 mil jovens em Moçambique e Angola.',
    text: 'Uma ferramenta que supera vários bancos internacionais. A melhor do mercado para receber do Brasil e levantar em meticais.',
    items: [
      { icon: <Users className="h-6 w-6" />, label: '+10 mil jovens ativos' },
      { icon: <Trophy className="h-6 w-6" />, label: 'Supera bancos internacionais' },
      { icon: <Globe className="h-6 w-6" />, label: 'Moçambique e Angola' },
    ],
  },
  {
    id: 'benefits',
    eyebrow: 'Seja Pro e tenha',
    title: 'Tudo ativo na sua conta em menos de 1 minuto.',
    text: 'Chaves Pix visíveis, carteiras móveis vinculadas e levantamentos liberados para o seu número.',
    items: [
      { icon: <KeyRound className="h-6 w-6" />, label: 'Chaves Pix ativas e visíveis' },
      { icon: <PixSymbol className="h-6 w-6" />, label: 'Pix ativo para receber do Brasil' },
      { icon: <Wallet className="h-6 w-6" />, label: 'M-Pesa e e-Mola ativos' },
      { icon: <Banknote className="h-6 w-6" />, label: 'Levantamento para carteiras locais' },
    ],
  },
] as const

export function ProIntro({ onClose }: ProIntroProps) {
  const [index, setIndex] = useState(0)
  const step = STEPS[index]
  const isLast = index === STEPS.length - 1

  useEffect(() => {
    analytics.proIntroViewed('app')
  }, [])

  const handleActivate = () => {
    analytics.proActivateClicked()
    openProActivation()
    onClose()
  }

  return (
    <div className="flex min-h-dvh flex-col bg-brand-gradient text-primary-foreground animate-fade-in">
      <header className="flex items-center justify-between px-6 pt-4">
        <div className="flex items-center gap-1.5" aria-label={`Etapa ${index + 1} de ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                'h-1.5 rounded-full bg-primary-foreground transition-all duration-500',
                i === index ? 'w-8 opacity-100' : 'w-3 opacity-40',
              )}
            />
          ))}
        </div>
        {!isLast ? (
          <button
            type="button"
            onClick={() => setIndex(STEPS.length - 1)}
            className="h-10 px-3 text-sm font-semibold underline underline-offset-4 decoration-2"
          >
            Saltar
          </button>
        ) : (
          <button type="button" onClick={onClose} className="h-10 px-3 text-sm font-semibold underline underline-offset-4 decoration-2">
            Fechar
          </button>
        )}
      </header>

      <main key={step.id} className="flex flex-1 flex-col justify-center gap-8 px-6 py-10">
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary-foreground/80 animate-fade-in">
            <Sparkles className="h-4 w-4" /> {step.eyebrow}
          </span>
          <h1 className="text-balance text-3xl font-bold leading-tight animate-step-forward">{step.title}</h1>
          <p className="text-pretty text-base leading-relaxed text-primary-foreground/85 animate-fade-in [animation-delay:300ms]">
            {step.text}
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {step.items.map((item, i) => (
            <li
              key={item.label}
              className="flex items-center gap-4 rounded-2xl bg-background/12 px-4 py-3.5 backdrop-blur-sm animate-pop-in"
              style={{ animationDelay: `${500 + i * 180}ms` }}
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
        {isLast ? (
          <>
            <button
              type="button"
              onClick={handleActivate}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-background text-base font-bold text-primary shadow-lg transition-transform active:scale-[0.98] animate-pop-in [animation-delay:1200ms]"
            >
              <Sparkles className="h-5 w-5" /> Quero Ativar
              <ExternalLink className="h-4 w-4 opacity-70" />
            </button>
            <p className="text-center text-xs text-primary-foreground/70">Você será levado para a página de ativação segura.</p>
          </>
        ) : (
          <PrimaryButton
            onClick={() => setIndex((i) => i + 1)}
            className="bg-background text-primary shadow-lg hover:bg-background/90"
          >
            Continuar <ArrowRight className="h-5 w-5" />
          </PrimaryButton>
        )}
      </footer>
    </div>
  )
}
