'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Check, ArrowDown, Wallet } from 'lucide-react'
import { formatBRL, formatMZN, convertToMZN, BRL_TO_MZN, type Transaction } from '@/lib/store'
import { MOBILE_WALLETS, formatMozPhone, isValidMozPhone, formatCurrencyInput, currencyInputToNumber } from '@/lib/onboarding-format'
import { StepShell, PrimaryButton, OptionRow, PinField } from '@/components/onboarding/ui'
import { cn } from '@/lib/utils'
import { TIMING } from '@/lib/timing'

type WalletId = (typeof MOBILE_WALLETS)[number]['id']
type Step = 'amount' | 'wallet' | 'phone' | 'pin' | 'processing' | 'success'

interface WithdrawFlowProps {
  balance: number
  transactionPin?: string
  linkedWallets?: string[]
  onWithdrawal: (transaction: Transaction) => void
  onDone: () => void
  onCancel: () => void
}

const PROCESSING_MESSAGES = [
  'Conectando à sua carteira...',
  'Convertendo BRL para MZN...',
  'Confirmando os dados...',
  'Processando transferência...',
  'Levantamento concluído!',
]

export function WithdrawFlow({ balance, transactionPin, linkedWallets, onWithdrawal, onDone, onCancel }: WithdrawFlowProps) {
  const [step, setStep] = useState<Step>('amount')
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [amountInput, setAmountInput] = useState('')
  const [wallet, setWallet] = useState<WalletId | null>(null)
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const [result, setResult] = useState<Transaction | null>(null)

  const amount = currencyInputToNumber(amountInput)
  const amountMZN = convertToMZN(amount)
  const amountValid = amount > 0 && amount <= balance
  const wallets = MOBILE_WALLETS.filter((w) => !linkedWallets?.length || linkedWallets.includes(w.id))
  const selectedWallet = MOBILE_WALLETS.find((w) => w.id === wallet)

  const go = (next: Step, dir: 'forward' | 'backward' = 'forward') => {
    setDirection(dir)
    setStep(next)
  }

  const startProcessing = () => {
    setMessageIndex(0)
    go('processing')
  }

  const handlePinChange = (value: string) => {
    setPin(value)
    setPinError(false)
    if (value.length !== 4) return
    if (!transactionPin || value === transactionPin) {
      startProcessing()
    } else {
      setPinError(true)
      setTimeout(() => setPin(''), 400)
    }
  }

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

  if (step === 'amount') {
    return (
      <StepShell
        stepKey="withdraw-amount"
        direction={direction}
        onBack={onCancel}
        title="Quanto você quer levantar?"
        subtitle={`Saldo disponível: ${formatBRL(balance)}`}
        footer={<PrimaryButton disabled={!amountValid} onClick={() => go('wallet')}>Continuar</PrimaryButton>}
      >
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            if (amountValid) go('wallet')
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
        </form>
      </StepShell>
    )
  }

  if (step === 'wallet') {
    return (
      <StepShell
        stepKey="withdraw-wallet"
        direction={direction}
        onBack={() => go('amount', 'backward')}
        title="Para qual carteira móvel?"
        subtitle={`Vamos enviar ${formatMZN(amountMZN)}.`}
        footer={<PrimaryButton disabled={!wallet} onClick={() => go('phone')}>Continuar</PrimaryButton>}
      >
        <div className="flex flex-col gap-3">
          {wallets.map((w) => (
            <OptionRow
              key={w.id}
              selected={wallet === w.id}
              onSelect={() => setWallet(w.id)}
              badge={w.operator}
              leading={
                <Image src={w.logo} alt="" width={44} height={44} className="h-11 w-11 rounded-xl object-cover" />
              }
            >
              {w.name}
            </OptionRow>
          ))}
        </div>
      </StepShell>
    )
  }

  if (step === 'phone') {
    const valid = isValidMozPhone(phone)
    return (
      <StepShell
        stepKey="withdraw-phone"
        direction={direction}
        onBack={() => go('wallet', 'backward')}
        title={`Qual é o seu número ${selectedWallet?.name}?`}
        subtitle="O valor será creditado neste número."
        footer={<PrimaryButton disabled={!valid} onClick={() => go('pin')}>Continuar</PrimaryButton>}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) go('pin')
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
              placeholder="84 000 0000"
              className="w-full bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground/50"
            />
          </div>
        </form>
      </StepShell>
    )
  }

  if (step === 'pin') {
    return (
      <StepShell
        stepKey="withdraw-pin"
        direction={direction}
        onBack={() => go('phone', 'backward')}
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

  if (step === 'processing') {
    const progress = ((messageIndex + 1) / PROCESSING_MESSAGES.length) * 100
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-10 bg-background px-6 animate-fade-in">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-4 border-accent" />
          <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          {selectedWallet ? (
            <Image src={selectedWallet.logo} alt={selectedWallet.name} width={80} height={80} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <Wallet className="h-10 w-10 text-primary" />
          )}
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xl font-semibold">{PROCESSING_MESSAGES[messageIndex]}</p>
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
