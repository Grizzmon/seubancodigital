'use client'

import { useEffect } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { PrimaryButton } from '@/components/onboarding/ui'
import { PixSymbol } from './pix-symbol'

interface FirstPixSheetProps {
  open: boolean
  featureName?: string
  onClose: () => void
  onGoToPix: () => void
}

// Conta Pro sem movimentações: orienta a fazer o primeiro Pix antes de usar o resto.
export function FirstPixSheet({ open, featureName, onClose, onGoToPix }: FirstPixSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="first-pix-title">
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
            <PixSymbol className="h-8 w-8" />
          </span>
          <div className="flex flex-col gap-2">
            <h2 id="first-pix-title" className="text-balance text-2xl font-bold">
              Você ainda não recebeu ou fez seu primeiro Pix
            </h2>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {featureName ? `${featureName} fica disponível` : 'Esta funcionalidade fica disponível'} depois da primeira
              movimentação. Suas chaves Pix já estão ativas: compartilhe uma e receba do Brasil agora.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <PrimaryButton onClick={onGoToPix}>
            Fazer Pix <ArrowRight className="h-5 w-5" />
          </PrimaryButton>
          <button type="button" onClick={onClose} className="h-11 text-sm font-semibold text-muted-foreground">
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
