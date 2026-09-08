'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Lock } from 'lucide-react'
import { DotsLoader } from '@/components/ui/dots-loader'
import type { PixKey } from '@/lib/store'
import { generatePixCPF, generatePixCelular, generatePixRandomKey, PIX_KEY_TYPES, pixKeyTypeLabel } from '@/lib/pix-keys'
import { capitalizeWords } from '@/lib/onboarding-format'
import { maskPixKey } from '@/lib/pro'
import { TIMING } from '@/lib/timing'
import { StepShell, UnderlineInput, PrimaryButton, OptionRow } from '@/components/onboarding/ui'
import { PixSymbol } from './pix-symbol'
import { ProGateSheet } from './pro-gate-sheet'

interface PixKeyFlowProps {
  userName: string
  onAddKey: (key: PixKey) => void
  onDone: () => void
  onCancel: () => void
  onOpenPro: () => void
}

type Step = 'name' | 'type' | 'generating' | 'success'

const GENERATING_MESSAGES = [
  'Conectando ao Banco Central...',
  'Validando o nome informado...',
  'Gerando a sua chave...',
  'Registrando no diretório Pix...',
  'Chave ativada!',
]

export function PixKeyFlow({ userName, onAddKey, onDone, onCancel, onOpenPro }: PixKeyFlowProps) {
  const [step, setStep] = useState<Step>('name')
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [name, setName] = useState(capitalizeWords(userName))
  const [type, setType] = useState<PixKey['type']>('cpf')
  const [messageIndex, setMessageIndex] = useState(0)
  const [created, setCreated] = useState<PixKey | null>(null)
  const [gateOpen, setGateOpen] = useState(false)

  const go = (next: Step, dir: 'forward' | 'backward' = 'forward') => {
    setDirection(dir)
    setStep(next)
  }

  const handleGenerate = () => {
    setMessageIndex(0)
    go('generating')
  }

  useEffect(() => {
    if (step !== 'generating') return
    if (messageIndex >= GENERATING_MESSAGES.length - 1) {
      const value = type === 'cpf' ? generatePixCPF() : type === 'celular' ? generatePixCelular() : generatePixRandomKey()

      const key: PixKey = {
        id: crypto.randomUUID(),
        name: name.trim(),
        type,
        value,
        createdAt: new Date(),
      }
      const finish = setTimeout(() => {
        onAddKey(key)
        setCreated(key)
        go('success')
      }, TIMING.successHold)
      return () => clearTimeout(finish)
    }
    const timer = setTimeout(() => setMessageIndex((i) => i + 1), TIMING.pixKeyMessage)
    return () => clearTimeout(timer)
  }, [step, messageIndex, type, name, onAddKey])

  if (step === 'name') {
    return (
      <StepShell
        stepKey="pix-name"
        direction={direction}
        onBack={onCancel}
        title="Qual nome você deseja usar no Pix?"
        subtitle="Não precisa ser exatamente igual ao documento. Vamos conectar ao Banco Central em poucos minutos."
        footer={<PrimaryButton disabled={name.trim().length < 3} onClick={() => go('type')}>Seguinte</PrimaryButton>}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim().length >= 3) go('type')
          }}
        >
          <UnderlineInput
            autoFocus
            value={name}
            onChange={(e) => setName(capitalizeWords(e.target.value))}
            placeholder="Ex.: Lisa Armando Luís"
            autoComplete="name"
          />
        </form>
      </StepShell>
    )
  }

  if (step === 'type') {
    return (
      <StepShell
        stepKey="pix-type"
        direction={direction}
        onBack={() => go('name', 'backward')}
        title="Escolha o tipo de chave"
        subtitle={`A chave ficará vinculada a ${name.trim()}.`}
        footer={<PrimaryButton onClick={handleGenerate}>Cadastrar chave</PrimaryButton>}
      >
        <div className="flex flex-col gap-3">
          {PIX_KEY_TYPES.map((option) => (
            <OptionRow key={option.id} selected={type === option.id} onSelect={() => setType(option.id)} badge={option.hint}>
              {option.label}
            </OptionRow>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Chaves por e-mail não estão disponíveis: todas as chaves são geradas automaticamente.</p>
      </StepShell>
    )
  }

  if (step === 'generating') {
    const progress = ((messageIndex + 1) / GENERATING_MESSAGES.length) * 100
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-10 bg-background px-6 animate-fade-in">
        <DotsLoader size={16} className="text-primary" />
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xl font-semibold">{GENERATING_MESSAGES[messageIndex]}</p>
          <p className="text-sm text-muted-foreground">Não feche o aplicativo</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-brand-gradient transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-16 animate-step-forward">
      <div className="flex flex-1 flex-col items-center gap-8 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-success text-background animate-pop-in">
          <Check className="h-12 w-12" strokeWidth={3} />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Chave cadastrada!</h1>
          <p className="text-pretty text-lg text-muted-foreground">
            Sua chave já aparece na Área Pix. Ative a conta Pro para vê-la completa e começar a receber.
          </p>
        </div>

        {created ? (
          <div className="flex w-full flex-col gap-4 rounded-2xl border-2 border-border bg-card p-5 text-left">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                <PixSymbol className="h-5 w-5" />
              </span>
              <div className="flex flex-1 flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {pixKeyTypeLabel(created.type)}
                </span>
                <span className="text-sm text-muted-foreground">{created.name}</span>
              </div>
              <Lock className="h-5 w-5 text-muted-foreground" aria-label="Chave bloqueada" />
            </div>
            <p className="break-all text-base font-semibold tabular-nums tracking-wide blur-[1.5px] select-none">
              {maskPixKey(created)}
            </p>
            <button
              type="button"
              onClick={() => setGateOpen(true)}
              className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-primary text-sm font-semibold text-primary transition-colors hover:bg-accent"
            >
              <Copy className="h-4 w-4" />
              Ver e copiar chave
            </button>
          </div>
        ) : null}
      </div>

      <div className="pt-8">
        <PrimaryButton onClick={onDone}>Concluir</PrimaryButton>
      </div>

      <ProGateSheet
        open={gateOpen}
        variant="keys"
        onClose={() => setGateOpen(false)}
        onActivate={() => {
          setGateOpen(false)
          onOpenPro()
        }}
      />
    </div>
  )
}
