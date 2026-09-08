'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Check, ArrowDown, AlertTriangle, Wallet, Smartphone } from 'lucide-react'
import { formatBRL, formatMZN, convertToMZN, BRL_TO_MZN, type Transaction } from '@/lib/store'
import { MOBILE_WALLETS, formatMozPhone, formatCurrencyInput, currencyInputToNumber } from '@/lib/onboarding-format'
import { StepShell, PrimaryButton, GhostButton, OptionRow, PinField } from '@/components/onboarding/ui'
import { DotsLoader } from '@/components/ui/dots-loader'
import { PixSymbol } from './pix-symbol'
import { cn } from '@/lib/utils'
import { TIMING } from '@/lib/timing'

type WalletId = (typeof MOBILE_WALLETS)[number]['id']
type Step = 'wallet' | 'phone' | 'confirm' | 'connecting' | 'amount' | 'no-balance' | 'pin' | 'processing' | 'success'

// Prefixos válidos de cada operadora em Moçambique.
const WALLET_PREFIXES: Record<WalletId, readonly string[]> = {
  mpesa: ['84', '85'],
  emola: ['86', '87'],
  mkesh: ['82', '83'],
}

interface WithdrawFlowProps {
  balance: number
  transactionPin?: string
  onWithdrawal: (transaction: Transaction) => void
  onDone: () => void
  onGoToPix: () => void
  onCancel: () => void
}

const CONNECTING_MESSAGES = [
  'Conectando à operadora...',
  'Validando o número informado...',
  'Verificando a carteira...',
  'Carteira pronta para receber.',
]

const PROCESSING_MESSAGES = [
  'Convertendo BRL para MZN...',
  'Confirmando os dados...',
  'Processando transferência...',
  'Levantamento concluído!',
]

function phonePrefixError(digits: string, wallet: WalletId | null): string | null {
  if (!wallet || digits.length < 2) return null
  const prefix = digits.slice(0, 2)
  const allowed = WALLET_PREFIXES[wallet]
  if (allowed.includes(prefix)) return null
  const name = MOBILE_WALLETS.find((w) => w.id === wallet)?.name
  return `Números ${name} começam com ${allowed.join(' ou ')}.`
}

export function WithdrawFlow({ balance, transactionPin, onWithdrawal, onDone, onGoToPix, onCancel }: WithdrawFlowProps) {
  const [step, setStep] = useState<Step>('wallet')
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [wallet, setWallet] = useState<WalletId | null>(null)
  const [phone, setPhone] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const [result, setResult] = useState<Transaction | null>(null)

  const selectedWallet = MOBILE_WALLETS.find((w) => w.id === wallet)
  const phoneDigits = phone.replace(/\D/g, '')
  const prefixError = phonePrefixError(phoneDigits, wallet)
  const phoneValid = phoneDigits.length === 9 && !prefixError

  const amount = currencyInputToNumber(amountInput)
  const amountMZN = convertToMZN(amount)
  const hasBalance = balance > 0
  const amountValid = amount > 0 && amount <= balance

  const go = (next: Step, dir: 'forward' | 'backward' = 'forward') => {
    setDirection(dir)
    setStep(next)
  }

  const startLoader = (next: 'connecting' | 'processing') => {
    setMessageIndex(0)
    go(next)
  }

  const handlePinChange = (value: string) => {
    setPin(value)
    setPinError(false)
    if (value.length !== 4) return
    if (!transactionPin || value === transactionPin) {
      startLoader('processing')
    } else {
      setPinError(true)
      setTimeout(() => setPin(''), 400)
    }
  }

  // Loader depois de confirmar o número: termina no valor ou no aviso de saldo.
  useEffect(() => {
    if (step !== 'connecting') return
    if (messageIndex >= CONNECTING_MESSAGES.length - 1) {
      const finish = setTimeout(() => go(hasBalance ? 'amount' : 'no-balance'), TIMING.successHold)
      return () => clearTimeout(finish)
    }
    const timer = setTimeout(() => setMessageIndex((i) => i + 1), TIMING.withdrawMessage)
    return () => clearTimeout(timer)
  }, [step, messageIndex, hasBalance])

  useEffect(() => {
    if (step !== 'processing' || !wallet) return
    if (messageIndex >= PROCESSING_MESSAGES.length - 1) {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'withdrawal',
        amount,
        amountMZN,
        method: wallet,
        date: new Date(),
        status: 'completed',
      }
      const finish = setTimeout(() => {
        onWithdrawal(transaction)
        setResult(transaction)
        go('success')
      }, TIMING.successHold)
      return () => clearTimeout(finish)
    }
    const timer = setTimeout(() => setMessageIndex((i) => i + 1), TIMING.withdrawMessage)
    return () => clearTimeout(timer)
  }, [step, messageIndex, wallet, amount, amountMZN, onWithdrawal])

  if (step === 'wallet') {
    return (
      <StepShell
        stepKey="withdraw-wallet"
        direction={direction}
        onBack={onCancel}
        title="Para qual carteira móvel?"
        subtitle="Escolha onde quer receber o dinheiro em meticais."
        footer={<PrimaryButton disabled={!wallet} onClick={() => go('phone')}>Continuar</PrimaryButton>}
      >
        <div className="flex flex-col gap-3">
          {MOBILE_WALLETS.map((w) => (
            <OptionRow
              key={w.id}
              selected={wallet === w.id}
              onSelect={() => {
                setWallet(w.id)
                setPhone('')
              }}
              badge={`${w.operator} · ${WALLET_PREFIXES[w.id].join('/')}`}
              leading={<Image src={w.logo} alt="" width={44} height={44} className="h-11 w-11 rounded-xl object-cover" />}
            >
              {w.name}
            </OptionRow>
          ))}
        </div>
      </StepShell>
    )
  }

  if (step === 'phone') {
    return (
      <StepShell
        stepKey="withdraw-phone"
        direction={direction}
        onBack={() => go('wallet', 'backward')}
        title={`Qual é o seu número ${selectedWallet?.name}?`}
        subtitle={`Aceita números que começam com ${wallet ? WALLET_PREFIXES[wallet].join(' ou ') : ''}.`}
        footer={<PrimaryButton disabled={!phoneValid} onClick={() => go('confirm')}>Continuar</PrimaryButton>}
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (phoneValid) go('confirm')
          }}
        >
          <div className="flex items-end gap-3 border-b-2 border-border py-3 transition-colors focus-within:border-primary">
            <span className="pb-0.5 text-2xl font-semibold text-muted-foreground">+258</span>
            <input
              autoFocus
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(formatMozPhone(e.target.value))}
              placeholder={`${wallet ? WALLET_PREFIXES[wallet][0] : '84'} 000 0000`}
              className="w-full bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground/50"
            />
          </div>
          {prefixError ? <p className="text-sm font-medium text-destructive">{prefixError}</p> : null}
        </form>
      </StepShell>
    )
  }

  if (step === 'confirm') {
    return (
      <StepShell
        stepKey="withdraw-confirm"
        direction={direction}
        onBack={() => go('phone', 'backward')}
        title="Confirme o número"
        subtitle="O dinheiro será enviado para esta carteira. Verifique com atenção."
        footer={
          <div className="flex flex-col gap-2">
            <PrimaryButton onClick={() => startLoader('connecting')}>O número está correto</PrimaryButton>
            <GhostButton onClick={() => go('phone', 'backward')}>Corrigir número</GhostButton>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-5">
            {selectedWallet ? (
              <Image src={selectedWallet.logo} alt="" width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />
            ) : null}
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">{selectedWallet?.name} · {selectedWallet?.operator}</span>
              <span className="whitespace-nowrap text-xl font-bold tabular-nums tracking-wide">+258 {phone}</span>
            </div>
          </div>
          <p className="flex items-start gap-3 rounded-2xl bg-warning/15 p-4 text-sm leading-relaxed text-foreground">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            Certifique-se de que o número está certo. Levantamentos enviados para um número errado não podem ser
            recuperados.
          </p>
        </div>
      </StepShell>
    )
  }

  if (step === 'connecting' || step === 'processing') {
    const messages = step === 'connecting' ? CONNECTING_MESSAGES : PROCESSING_MESSAGES
    const progress = ((messageIndex + 1) / messages.length) * 100
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-10 bg-background px-6 animate-fade-in">
        <DotsLoader size={16} className="text-primary" />
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xl font-semibold">{messages[messageIndex]}</p>
          <p className="text-sm text-muted-foreground">Não feche o aplicativo</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-brand-gradient transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>
    )
  }

  if (step === 'no-balance') {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-16 animate-step-forward">
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-primary animate-pop-in">
            <Wallet className="h-11 w-11" />
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="text-balance text-3xl font-bold">Parece que está sem saldo</h1>
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              A sua carteira {selectedWallet?.name} <span className="font-semibold text-foreground">+258 {phone}</span> está
              pronta. Deposite ou receba um Pix agora para fazer o seu primeiro levantamento.
            </p>
          </div>
          <dl className="flex w-full items-center justify-between rounded-2xl border-2 border-border bg-card px-5 py-4">
            <dt className="text-sm text-muted-foreground">Saldo disponível</dt>
            <dd className="text-xl font-bold tabular-nums">{formatBRL(balance)}</dd>
          </dl>
        </div>
        <div className="flex flex-col gap-2 pt-8">
          <PrimaryButton onClick={onGoToPix}>
            <PixSymbol className="h-5 w-5" /> Depositar ou receber no Pix agora
          </PrimaryButton>
          <GhostButton onClick={onDone}>Voltar ao início</GhostButton>
        </div>
      </div>
    )
  }

  if (step === 'amount') {
    return (
      <StepShell
        stepKey="withdraw-amount"
        direction={direction}
        onBack={() => go('confirm', 'backward')}
        title="Quanto você quer levantar?"
        subtitle={`Saldo disponível: ${formatBRL(balance)}`}
        footer={<PrimaryButton disabled={!amountValid} onClick={() => go('pin')}>Continuar</PrimaryButton>}
      >
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            if (amountValid) go('pin')
          }}
        >
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-muted-foreground">Valor em reais (BRL)</span>
            <div className="flex items-end gap-2 border-b-2 border-border py-3 transition-colors focus-within:border-primary">
              <span className="pb-1 text-xl font-semibold text-muted-foreground">R$</span>
              <input
                autoFocus
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => setAmountInput(formatCurrencyInput(e.target.value))}
                placeholder="0,00"
                className="w-full bg-transparent text-4xl font-bold tabular-nums text-foreground outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            {amount > balance ? (
              <span className="text-sm font-medium text-destructive">Valor maior que o saldo disponível.</span>
            ) : null}
          </label>

          <div className={cn('flex flex-col gap-3 rounded-2xl bg-accent p-5 transition-opacity', amount > 0 ? 'opacity-100' : 'opacity-50')}>
            <div className="flex items-center gap-2 text-sm font-semibold text-accent-foreground">
              <ArrowDown className="h-4 w-4" />
              Você recebe em meticais
            </div>
            <p className="text-3xl font-bold tabular-nums text-accent-foreground">{formatMZN(amountMZN)}</p>
            <p className="text-xs text-accent-foreground/70">Câmbio: 1 BRL = {BRL_TO_MZN},00 MZN</p>
          </div>

          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" /> {selectedWallet?.name} · +258 {phone}
          </p>
        </form>
      </StepShell>
    )
  }

  if (step === 'pin') {
    return (
      <StepShell
        stepKey="withdraw-pin"
        direction={direction}
        onBack={() => go('amount', 'backward')}
        title="Digite sua senha de transação"
        subtitle={`Autorize o levantamento de ${formatMZN(amountMZN)} para +258 ${phone}.`}
      >
        <div className="flex flex-col gap-4">
          <PinField length={4} value={pin} onChange={handlePinChange} autoFocus label="Senha de transação" error={pinError} />
          {pinError ? <p className="text-sm font-medium text-destructive">Senha incorreta. Tente novamente.</p> : null}
        </div>
      </StepShell>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-16 animate-step-forward">
      <div className="flex flex-1 flex-col items-center gap-8 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-success text-background animate-pop-in">
          <Check className="h-12 w-12" strokeWidth={3} />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Levantamento concluído!</h1>
          <p className="text-pretty text-lg text-muted-foreground">O valor foi enviado para a sua carteira {selectedWallet?.name}.</p>
        </div>

        {result ? (
          <dl className="flex w-full flex-col divide-y divide-border rounded-2xl border-2 border-border bg-card px-5 text-left">
            <div className="flex items-center justify-between py-4">
              <dt className="text-sm text-muted-foreground">Valor em BRL</dt>
              <dd className="font-semibold tabular-nums">{formatBRL(result.amount)}</dd>
            </div>
            <div className="flex items-center justify-between py-4">
              <dt className="text-sm text-muted-foreground">Recebido em MZN</dt>
              <dd className="text-xl font-bold tabular-nums text-primary">{formatMZN(result.amountMZN)}</dd>
            </div>
            <div className="flex items-center justify-between py-4">
              <dt className="text-sm text-muted-foreground">Carteira</dt>
              <dd className="font-semibold">{selectedWallet?.name} · +258 {phone}</dd>
            </div>
          </dl>
        ) : null}
      </div>

      <div className="pt-8">
        <PrimaryButton onClick={onDone}>Voltar ao início</PrimaryButton>
      </div>
    </div>
  )
}
