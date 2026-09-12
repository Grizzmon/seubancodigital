'use client'

import { useState } from 'react'
import { ChevronLeft, Plus, Lock, Banknote, KeyRound, Sparkles, Copy, Check, ShieldAlert, TrendingUp, ExternalLink } from 'lucide-react'
import type { PixKey } from '@/lib/store'
import { pixKeyTypeLabel } from '@/lib/pix-keys'
import { maskPixKey, openUpgradePlan } from '@/lib/pro'
import { analytics } from '@/lib/analytics'
import { PrimaryButton } from '@/components/onboarding/ui'
import { PixSymbol } from './pix-symbol'
import { ProGateSheet, type ProGateVariant } from './pro-gate-sheet'
import { KeyActivationSheet } from './key-activation-sheet'

interface PixAreaViewProps {
  keys: PixKey[]
  isPro: boolean
  onBack: () => void
  onCreateKey: () => void
  onWithdraw: () => void
  onOpenPro: () => void
}

export function PixAreaView({ keys, isPro, onBack, onCreateKey, onWithdraw, onOpenPro }: PixAreaViewProps) {
  const [gate, setGate] = useState<ProGateVariant | null>(null)
  const [keyIssueOpen, setKeyIssueOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Conta gratuita: só a primeira chave pode ser cadastrada. Pro: sem limite.
  const handleCreateKey = () => (isPro || keys.length === 0 ? onCreateKey() : setGate('more-keys'))

  const handleCopy = async (key: PixKey) => {
    await navigator.clipboard.writeText(key.value)
    analytics.pixKeyCopied(key.type)
    setCopiedId(key.id)
    setTimeout(() => setCopiedId((current) => (current === key.id ? null : current)), 1800)
  }

  const handleUpgrade = () => {
    analytics.upgradePlanClicked('pix-area')
    openUpgradePlan()
  }

  const subtitle =
    keys.length === 0
      ? 'Nenhuma chave cadastrada'
      : isPro
        ? `${keys.length} chave${keys.length > 1 ? 's' : ''} ativa${keys.length > 1 ? 's' : ''}`
        : `${keys.length} chave${keys.length > 1 ? 's' : ''} aguardando ativação`

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
            <p className="flex items-center gap-2 text-sm text-primary-foreground/80">
              {isPro && keys.length > 0 ? <span className="h-2 w-2 rounded-full bg-success" aria-hidden /> : null}
              {subtitle}
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
            <PrimaryButton onClick={handleCreateKey}>
              <Plus className="h-5 w-5" />
              Cadastrar Nova Chave
            </PrimaryButton>
          </div>
        ) : (
          <>
            {isPro ? (
              <div className="flex items-center gap-3 rounded-2xl bg-success/10 px-4 py-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold text-success">Chaves ativas e prontas para receber</span>
                  <span className="text-pretty text-xs text-muted-foreground">Toque em uma chave para copiar e compartilhar.</span>
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setGate('keys')}
                className="flex items-center gap-3 rounded-2xl bg-accent px-4 py-3 text-left"
              >
                <Lock className="h-5 w-5 shrink-0 text-primary" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold text-primary">Chaves aguardando ativação</span>
                  <span className="text-pretty text-xs text-muted-foreground">Ative a conta Pro para ver e copiar. Leva menos de 1 minuto.</span>
                </span>
                <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Ativar</span>
              </button>
            )}

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Minhas chaves</h2>
              <ul className="flex flex-col gap-3">
                {keys.map((key) => {
                  const copied = copiedId === key.id
                  return (
                    <li key={key.id}>
                      <button
                        type="button"
                        onClick={() => (isPro ? handleCopy(key) : setGate('keys'))}
                        className="flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                          <PixSymbol className="h-5 w-5" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                            {pixKeyTypeLabel(key.type)}
                          </span>
                          {isPro ? (
                            <span className="break-all text-sm font-semibold tabular-nums tracking-wide">{key.value}</span>
                          ) : (
                            <span className="truncate text-sm font-semibold tabular-nums tracking-wide blur-[1.5px] select-none">
                              {maskPixKey(key)}
                            </span>
                          )}
                          <span className="truncate text-xs text-muted-foreground">{key.name}</span>
                        </span>
                        {isPro ? (
                          <span
                            aria-label={copied ? 'Chave copiada' : 'Copiar chave'}
                            className={
                              copied
                                ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-background'
                                : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary'
                            }
                          >
                            {copied ? <Check className="h-4 w-4" strokeWidth={3} /> : <Copy className="h-4 w-4" />}
                          </span>
                        ) : (
                          <span
                            aria-label="Chave bloqueada"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                          >
                            <Lock className="h-4 w-4" />
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            {isPro ? (
              <button
                type="button"
                onClick={() => setKeyIssueOpen(true)}
                className="flex items-center gap-3 rounded-2xl border-2 border-primary/30 bg-accent px-4 py-3 text-left transition-transform active:scale-[0.99]"
              >
                <ShieldAlert className="h-6 w-6 shrink-0 text-primary" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold uppercase tracking-wide text-primary">Bancos não reconhecem minhas chaves!</span>
                  <span className="text-pretty text-xs text-muted-foreground">Toque aqui para resolver com a ativação geral.</span>
                </span>
              </button>
            ) : null}

            <div className="flex flex-col gap-3 pt-2">
              <PrimaryButton onClick={handleCreateKey}>
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
              {!isPro ? (
                <button
                  type="button"
                  onClick={onOpenPro}
                  className="flex h-11 items-center justify-center gap-2 text-sm font-semibold text-primary"
                >
                  <Sparkles className="h-4 w-4" /> Veja como ser Pro
                </button>
              ) : null}
            </div>

            {isPro ? (
              <section className="flex flex-col gap-3 rounded-2xl bg-brand-gradient p-5 text-primary-foreground shadow-lg shadow-primary/20">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background/15">
                  <TrendingUp className="h-6 w-6" />
                </span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">Subir plano</h2>
                  <p className="text-pretty text-sm leading-relaxed text-primary-foreground/85">
                    Limites maiores, mais chaves e levantamentos prioritários. Conheça os planos acima do Pro.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUpgrade}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-background text-sm font-bold text-primary transition-transform active:scale-[0.98]"
                >
                  Ver planos <ExternalLink className="h-4 w-4 opacity-70" />
                </button>
              </section>
            ) : null}
          </>
        )}
      </main>

      <ProGateSheet
        open={gate !== null}
        variant={gate ?? 'keys'}
        onClose={() => setGate(null)}
        onActivate={() => {
          setGate(null)
          onOpenPro()
        }}
      />

      <KeyActivationSheet open={keyIssueOpen} onClose={() => setKeyIssueOpen(false)} />
    </div>
  )
}
