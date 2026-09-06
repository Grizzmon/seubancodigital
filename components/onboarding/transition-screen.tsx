'use client'

import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'

interface TransitionScreenProps {
  message: string
  durationMs: number
}

// Tela intermediária mostrada entre uma seção e a próxima do cadastro.
// A barra inferior esvazia no mesmo tempo da transição.
export function TransitionScreen({ message, durationMs }: TransitionScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-10 bg-background px-8 text-center animate-fade-in"
    >
      <div className="relative flex h-36 w-36 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-accent animate-soft-pulse" />
        <span className="absolute inset-3 rounded-full border-[3px] border-primary/15" />
        <span className="absolute inset-3 rounded-full border-[3px] border-transparent border-t-primary animate-spin-slow" />
        <Image
          src="/images/realpayz-icon.png"
          alt=""
          width={64}
          height={64}
          className="relative h-16 w-16 rounded-2xl shadow-lg shadow-primary/30"
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-balance text-2xl font-bold text-foreground">{message}</p>
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-success" /> Conexão segura. Isto leva só alguns segundos.
        </p>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand-gradient animate-fill-width"
          style={{ animationDuration: `${durationMs}ms` }}
        />
      </div>
    </div>
  )
}
