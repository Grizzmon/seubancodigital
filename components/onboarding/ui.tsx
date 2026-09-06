'use client'

import { ArrowRight, ChevronLeft, Check } from 'lucide-react'
import Image from 'next/image'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function BrandMark({ size = 'md', withName = true }: { size?: 'sm' | 'md' | 'lg'; withName?: boolean }) {
  const px = size === 'lg' ? 96 : size === 'md' ? 44 : 32
  const nameClass = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg'
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/images/realpayz-icon.png"
        alt="RealPayz"
        width={px}
        height={px}
        priority
        className="rounded-2xl shadow-md shadow-primary/20"
      />
      {withName && (
        <span className={cn('font-bold tracking-tight text-foreground', nameClass)}>
          Real<span className="text-brand-gradient">Payz</span>
        </span>
      )}
    </div>
  )
}

interface StepShellProps {
  title: ReactNode
  subtitle?: ReactNode
  onBack?: () => void
  children?: ReactNode
  footer?: ReactNode
  direction?: 'forward' | 'backward'
  stepKey: string
  tone?: 'light' | 'dark'
}

// Uma pergunta por tela: cabeçalho com seta de voltar, título grande,
// conteúdo e rodapé fixo com a ação principal.
export function StepShell({
  title,
  subtitle,
  onBack,
  children,
  footer,
  direction = 'forward',
  stepKey,
  tone = 'light',
}: StepShellProps) {
  const dark = tone === 'dark'
  return (
    <div
      key={stepKey}
      className={cn(
        'mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-4',
        direction === 'forward' ? 'animate-step-forward' : 'animate-step-backward',
        dark ? 'bg-foreground text-background' : 'bg-background text-foreground',
      )}
    >
      <div className="flex h-12 items-center">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
              dark ? 'text-background hover:bg-background/10' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-8 pt-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight">{title}</h1>
          {subtitle ? (
            <p className={cn('text-pretty text-lg leading-relaxed', dark ? 'text-background/70' : 'text-muted-foreground')}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
      </div>

      {footer ? <div className="flex flex-col gap-3 pt-8">{footer}</div> : null}
    </div>
  )
}

export function UnderlineInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full border-b-2 border-border bg-transparent py-3 text-2xl font-semibold text-foreground outline-none transition-colors',
        'placeholder:font-normal placeholder:text-muted-foreground/50 focus:border-primary',
        className,
      )}
    />
  )
}

export function ArrowButton({
  disabled,
  onClick,
  label = 'Continuar',
}: {
  disabled?: boolean
  onClick?: () => void
  label?: string
}) {
  return (
    <div className="flex justify-end">
      <button
        type="submit"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 active:scale-95',
          disabled
            ? 'bg-muted text-muted-foreground'
            : 'bg-brand-gradient text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl',
        )}
      >
        <ArrowRight className="h-6 w-6" />
      </button>
    </div>
  )
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = 'button',
  className,
}: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-semibold transition-all duration-200 active:scale-[0.98]',
        disabled
          ? 'bg-muted text-muted-foreground'
          : 'bg-brand-gradient text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-14 w-full items-center justify-center rounded-full text-base font-semibold text-primary transition-colors hover:bg-accent',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function OptionRow({
  selected,
  onSelect,
  children,
  badge,
  multiple = false,
  leading,
}: {
  selected: boolean
  onSelect: () => void
  children: ReactNode
  badge?: string
  multiple?: boolean
  leading?: ReactNode
}) {
  return (
    <button
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition-all duration-200 active:scale-[0.99]',
        selected ? 'border-primary bg-accent' : 'border-border bg-background hover:border-muted-foreground/40',
      )}
    >
      {leading}
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-base font-semibold text-foreground">{children}</span>
        {badge ? <span className="text-xs font-semibold uppercase tracking-wide text-primary">{badge}</span> : null}
      </span>
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors',
          multiple ? 'rounded-md' : 'rounded-full',
          selected ? 'border-primary bg-brand-gradient text-primary-foreground' : 'border-border',
        )}
      >
        {selected ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
      </span>
    </button>
  )
}

// Campo de PIN numérico: caixas visuais sobre um input invisível.
export function PinField({
  length,
  value,
  onChange,
  autoFocus,
  label,
  error,
}: {
  length: 4 | 6
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
  label: string
  error?: boolean
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <div className="flex justify-between gap-2" aria-hidden>
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length
          const active = i === value.length
          return (
            <span
              key={i}
              className={cn(
                'flex h-16 flex-1 items-center justify-center rounded-2xl border-2 text-2xl font-bold transition-colors',
                error ? 'border-destructive' : active ? 'border-primary' : filled ? 'border-foreground/20' : 'border-border',
              )}
            >
              {filled ? <span className="h-3 w-3 rounded-full bg-foreground" /> : null}
            </span>
          )
        })}
      </div>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        maxLength={length}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  )
}
