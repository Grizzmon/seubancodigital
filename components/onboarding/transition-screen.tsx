'use client'

import { ShieldCheck } from 'lucide-react'
import { DotsLoader } from '@/components/ui/dots-loader'

interface TransitionScreenProps {
  message: string
  durationMs: number
}

// Tela intermediária mostrada entre uma seção e a próxima do cadastro.
// A barra inferior enche no mesmo tempo da transição.
export function TransitionScreen({ message, durationMs }: TransitionScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-10 bg-background px-8 text-center animate-fade-in"
    >
      <DotsLoader size={16} className="text-primary" />

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
