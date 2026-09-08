'use client'

import Image from 'next/image'
import { ArrowRight, Globe, Smartphone, ShieldCheck } from 'lucide-react'
import { PrimaryButton, GhostButton } from './ui'

interface WelcomeScreenProps {
  onStart: () => void
  onLogin: () => void
}

const highlights = [
  { icon: Globe, label: 'Pix internacional' },
  { icon: Smartphone, label: 'M-Pesa, e-Mola e mKesh' },
  { icon: ShieldCheck, label: 'Conta protegida' },
]

export function WelcomeScreen({ onStart, onLogin }: WelcomeScreenProps) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-brand-gradient text-primary-foreground animate-fade-in">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8 pt-16 text-center">
        <Image
          src="/images/realpayz-icon.png"
          alt=""
          width={112}
          height={112}
          priority
          className="rounded-[28px] shadow-2xl shadow-primary-deep/50 animate-pop-in"
        />
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl font-bold tracking-tight">RealPayz</h1>
          <p className="text-balance text-lg leading-relaxed text-primary-foreground/85">
            Seu dinheiro sem fronteiras, no seu ritmo.
          </p>
        </div>

        <ul className="flex flex-col gap-3 text-left">
          {highlights.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm font-medium text-primary-foreground/90">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-t-[32px] bg-background px-6 pb-10 pt-8 text-foreground">
        <div className="flex flex-col gap-3">
          <PrimaryButton onClick={onStart}>
            Criar conta <ArrowRight className="h-5 w-5" />
          </PrimaryButton>
          <GhostButton onClick={onLogin}>Já tenho uma conta</GhostButton>
        </div>
      </div>
    </div>
  )
}
