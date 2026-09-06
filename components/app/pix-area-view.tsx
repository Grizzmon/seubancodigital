'use client'

import { useState } from 'react'
import { ChevronLeft, Plus, Copy, Check, Banknote, KeyRound } from 'lucide-react'
import type { PixKey } from '@/lib/store'
import { pixKeyTypeLabel } from '@/lib/pix-keys'
import { PrimaryButton } from '@/components/onboarding/ui'
import { PixSymbol } from './pix-symbol'

interface PixAreaViewProps {
  keys: PixKey[]
  onBack: () => void
  onCreateKey: () => void
  onWithdraw: () => void
}

export function PixAreaView({ keys, onBack, onCreateKey, onWithdraw }: PixAreaViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (key: PixKey) => {
    await navigator.clipboard.writeText(key.value)
    setCopiedId(key.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background animate-step-forward">
      <header className="bg-brand-gradient px-6 pb-10 pt-4 text-primary-foreground">
        <div className="flex h-12 items-center">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-background/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>
        <div className="flex items-center gap-4 pt-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/15">
            <PixSymbol className="h-8 w-8" />
          </span>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Área Pix</h1>
            <p className="text-sm text-primary-foreground/80">
              {keys.length === 0 ? 'Nenhuma chave ativa' : `${keys.length} chave${keys.length > 1 ? 's' : ''} disponível${keys.length > 1 ? 'is' : ''}`}
            </p>
          </div>
        </div>
      </header>

      <main className="-mt-5 flex flex-1 flex-col gap-6 rounded-t-3xl bg-background px-6 pt-8 pb-10">
        {keys.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-primary animate-pop-in">
              <KeyRound className="h-11 w-11" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold">Nenhuma chave cadastrada ainda.</h2>
              <p className="text-pretty text-muted-foreground">
                Cadastre uma chave para começar a receber Pix do Brasil direto na sua conta.
              </p>
            </div>
            <PrimaryButton onClick={onCreateKey}>
              <Plus className="h-5 w-5" />
              Cadastrar Nova Chave
            </PrimaryButton>
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Minhas chaves</h2>
              <ul className="flex flex-col gap-3">
                {keys.map((key) => (
                  <li
                    key={key.id}
                    className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                      <PixSymbol className="h-5 w-5" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {pixKeyTypeLabel(key.type)}
                      </span>
                      <span className="truncate text-sm font-semibold tabular-nums tracking-wide">{key.value}</span>
                      <span className="truncate text-xs text-muted-foreground">{key.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(key)}
                      aria-label="Copiar chave"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                    >
                      {copiedId === key.id ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex flex-col gap-3 pt-2">
              <PrimaryButton onClick={onCreateKey}>
                <Plus className="h-5 w-5" />
                Cadastrar Nova Chave
              </PrimaryButton>
              <button
                type="button"
                onClick={onWithdraw}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-primary text-base font-semibold text-primary transition-colors hover:bg-accent"
              >
                <Banknote className="h-5 w-5" />
                Levantar para carteira móvel
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
