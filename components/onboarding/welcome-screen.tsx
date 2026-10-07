'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { PrimaryButton, GhostButton } from './ui'
import { HeroPhotos } from './hero-photos'

interface WelcomeScreenProps {
  onStart: () => void
  onLogin: () => void
}

export function WelcomeScreen({ onStart, onLogin }: WelcomeScreenProps) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-primary text-primary-foreground animate-fade-in">
      <div className="relative flex min-h-[26rem] flex-1 flex-col justify-between">
        <HeroPhotos />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-primary-deep/70 via-transparent to-primary-deep/90"
        />

        <header className="relative flex items-center gap-3 px-6 pt-8">
          <Image
            src="/images/realpayz-icon.png"
            alt=""
            width={44}
            height={44}
            priority
            className="rounded-2xl shadow-lg shadow-primary-deep/50"
          />
          <span className="text-2xl font-bold tracking-tight">RealPayz</span>
        </header>

        <div className="relative px-6 pb-14">
          <p className="text-balance text-3xl font-bold leading-tight">Seu dinheiro sem fronteiras, no seu ritmo.</p>
          <p className="mt-2 text-sm font-medium text-primary-foreground/85">
            Pix internacional, M-Pesa, e-Mola e mKesh numa conta protegida.
          </p>
        </div>
      </div>

      <div className="relative -mt-8 rounded-t-[32px] bg-background px-6 pb-10 pt-8 text-foreground">
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
