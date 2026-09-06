'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface ProcessingScreenProps {
  title: ReactNode
  subtitle?: string
  // Mensagens exibidas em sequência conforme o progresso avança.
  messages: readonly string[]
  progress: number
}

// Barra de progresso com lista de etapas que vão sendo "concluídas".
export function ProcessingScreen({ title, subtitle, messages, progress }: ProcessingScreenProps) {
  const activeIndex = Math.min(messages.length - 1, Math.floor((progress / 100) * messages.length))

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-10 bg-background px-8 animate-fade-in"
    >
      <div className="flex flex-col gap-2 text-center">
        <p className="text-balance text-2xl font-bold text-foreground">{title}</p>
        {subtitle ? <p className="text-pretty text-muted-foreground">{subtitle}</p> : null}
      </div>

      <div className="flex w-full flex-col gap-3">
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-brand-gradient transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-right text-sm font-semibold tabular-nums text-primary">{progress}%</p>
      </div>

      <ul className="flex w-full flex-col gap-3" aria-label="Etapas">
        {messages.map((message, i) => {
          const done = i < activeIndex || progress >= 100
          const active = i === activeIndex && progress < 100
          return (
            <li
              key={message}
              className={[
                'flex items-center gap-3 text-base transition-colors duration-500',
                done ? 'text-foreground' : active ? 'font-semibold text-foreground' : 'text-muted-foreground/60',
              ].join(' ')}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success animate-pop-in" />
              ) : active ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
              ) : (
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-border" />
              )}
              {message}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Progresso de 0 a 99 ao longo de `durationMs`; chega a 100 só quando `done` for true.
export function useTimedProgress(active: boolean, durationMs: number, done = true) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!active) return
    setProgress(0)
    const startedAt = Date.now()
    const tick = window.setInterval(() => {
      const pct = Math.min(99, Math.round(((Date.now() - startedAt) / durationMs) * 100))
      setProgress(pct)
      if (pct >= 99 && done) {
        setProgress(100)
        window.clearInterval(tick)
      }
    }, 80)
    return () => window.clearInterval(tick)
  }, [active, durationMs, done])

  return progress
}
