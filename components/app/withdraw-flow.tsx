'use client'

import { RegionBadge, useRegionalSettings, useRegionalCountry } from '@/components/regional-provider'
import { useEffect, useState } from 'react'
import { PaymentMethodIcon } from '@/components/payment-method-icon'
import { convertDemoBRL, formatLocalAmount, DEMO_BRL_RATES, walletPhoneError } from '@/lib/regional-settings'
import { Check, ArrowDown, AlertTriangle, Wallet, Smartphone } from 'lucide-react'
import { formatBRL, type Transaction } from '@/lib/store'
import { formatMozPhone, formatCurrencyInput, currencyInputToNumber } from '@/lib/onboarding-format'
import { StepShell, PrimaryButton, GhostButton, OptionRow, PinField } from '@/components/onboarding/ui'
import { DotsLoader } from '@/components/ui/dots-loader'
import { PixSymbol } from './pix-symbol'
import { cn } from '@/lib/utils'
import { TIMING } from '@/lib/timing'
import { analytics } from '@/lib/analytics'

type WalletId = Transaction['method']
type Step = 'wallet' | 'phone' | 'confirm' | 'connecting' | 'amount' | 'no-balance' | 'pin' | 'processing' | 'success'

const WALLET_PREFIXES: Record<string, readonly string[] | undefined> = {
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

function CountryWithdrawFlow({ balance, transactionPin, onWithdrawal, onDone, onGoToPix, onCancel }: WithdrawFlowProps) {
  const regional = useRegionalSettings()
  const { country } = useRegionalCountry()
  const wallets = regional.methods
  const processingMessages = [`Convertendo BRL para ${regional.currency}…`, 'Confirmando os dados…', 'Processando transferência…', 'Levantamento concluído!']
  const [step, setStep] = useState<Step>('wallet')
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [wallet, setWallet] = useState<WalletId | null>(null)
  const [phone, setPhone] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const [result, setResult] = useState<Transaction | null>(null)

  const selectedWallet = wallets.find((w) => w.id === wallet)
  const phoneDigits = phone.replace(/\D/g, '')
  const prefixError = walletPhoneError(phoneDigits, wallet, regional.code)
  const phoneValid = phoneDigits.length === country.length && !prefixError

  const amount = currencyInputToNumber(amountInput)
  const amountLocal = convertDemoBRL(amount, regional.currency)
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
    if (messageIndex >= processingMessages.length - 1) {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'withdrawal',
        amount,
        amountMZN: regional.code === 'MZ' ? amountLocal : 0,
        localAmount: amountLocal,
        localCurrency: regional.currency,
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
  }, [step, messageIndex, wallet, amount, amountLocal, regional.code, regional.currency, onWithdrawal])

  if (step === 'wallet') {
    return (
      <StepShell
        stepKey="withdraw-wallet"
        direction={direction}
        onBack={onCancel}
        title="Para qual carteira móvel?"
        subtitle={`Escolha onde quer receber em ${regional.currencyName}.`}
        footer={
          <PrimaryButton
            disabled={!wallet}
            onClick={() => {
              if (wallet) analytics.withdrawStarted(wallet)
              go('phone')
            }}
          >
            Continuar
          </PrimaryButton>
        }
      >
        <RegionBadge />
        <div className="flex flex-col gap-3">
          {wallets.map((w) => (
            <OptionRow
              key={w.id}
              selected={wallet === w.id}
              onSelect={() => {
                setWallet(w.id as WalletId)
                setPhone('')
              }}
              badge={regional.code === 'MZ' ? `${w.operator} · ${WALLET_PREFIXES[w.id]?.join('/')}` : w.operator}
              leading={<PaymentMethodIcon method={w} />}
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
        subtitle={regional.code === 'MZ' ? `Aceita números que começam com ${wallet ? WALLET_PREFIXES[wallet]?.join(' ou ') : ''}.` : `Use o número associado ao serviço em ${country.name} (+${country.dial}).`}
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
            <span className="pb-0.5 text-2xl font-semibold text-muted-foreground">{`+${country.dial}`}</span>
            <input
              autoFocus
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(regional.code === 'MZ' ? formatMozPhone(e.target.value) : (e.target.value.replace(/\D/g, '').slice(0, country.length).match(/.{1,3}/g)?.join(' ') || ''))}
              placeholder={regional.code === 'MZ' ? `${wallet ? WALLET_PREFIXES[wallet]?.[0] : '84'} 000 0000` : country.placeholder}
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
              <PaymentMethodIcon method={selectedWallet} size={56} />
            ) : null}
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">{selectedWallet?.name} · {selectedWallet?.operator}</span>
              <span className="whitespace-nowrap text-xl font-bold tabular-nums tracking-wide">+{country.dial} {phone}</span>
            </div>
          </div>
          <p className="flex items-start gap-3 rounded-2xl bg-warning/15 p-4 text-sm leading-relaxed text-foreground">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            Certifique-se de que o número está certo. Levantamentos enviados para um número errado não podem ser recuperados.
          </p>
        </div>
      </StepShell>
    )
  }

  if (step === 'connecting' || step === 'processing') {
    const messages = step === 'connecting' ? CONNECTING_MESSAGES : processingMessages
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
              A sua carteira {selectedWallet?.name} <span className="font-semibold text-foreground">+{country.dial} {phone}</span> está pronta. Deposite ou receba um Pix agora para fazer o seu primeiro levantamento.
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
              Você recebe em {regional.currencyName}
            </div>
            <p className="text-3xl font-bold tabular-nums text-accent-foreground">{formatLocalAmount(amountLocal, regional.currency)}</p>
            <p className="text-xs text-accent-foreground/70">Cotação comercial: 1 BRL = {DEMO_BRL_RATES[regional.currency]} {regional.symbol}</p>
          </div>

          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" /> {selectedWallet?.name} · +{country.dial} {phone}
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
        subtitle={`Autorize o levantamento de ${formatLocalAmount(amountLocal, regional.currency)} para +${country.dial} ${phone}.`}
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
              <dt className="text-sm text-muted-foreground">Recebido em {regional.currency}</dt>
              <dd className="text-xl font-bold tabular-nums text-primary">{formatLocalAmount(result.localAmount ?? result.amountMZN, result.localCurrency ?? 'MZN')}</dd>
            </div>
            <div className="flex items-center justify-between py-4">
              <dt className="text-sm text-muted-foreground">Carteira</dt>
              <dd className="font-semibold">{selectedWallet?.name} · +{country.dial} {phone}</dd>
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

export function WithdrawFlow(props: WithdrawFlowProps) {
  const regional = useRegionalSettings()
  if (regional.code === 'MZ' || regional.code === 'AO') return <CountryWithdrawFlow key={regional.code} {...props} />
  return (
    <StepShell
      stepKey="regional-withdrawal"
      onBack={props.onCancel}
      title="Levantamentos no seu país"
      subtitle={`A sua moeda local é ${regional.currencyName} (${regional.symbol}).`}
      footer={<PrimaryButton onClick={props.onCancel}>Voltar à conta</PrimaryButton>}
    >
      <RegionBadge />
      <p className="mb-5 rounded-2xl bg-accent p-4 text-sm leading-relaxed text-accent-foreground">
        Os levantamentos para estes serviços ainda não estão disponíveis no RealPayz. A opção será apresentada aqui quando estiver ativa.
      </p>
      <div className="flex flex-col gap-3">
        {regional.methods.map((method) => (
          <div key={method.id} className="flex items-center gap-3 rounded-2xl border border-border p-4">
            <PaymentMethodIcon method={method} />
            <div className="flex-1">
              <p className="font-semibold">{method.name}</p>
              <p className="text-sm text-muted-foreground">{method.operator}</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Em breve</span>
          </div>
        ))}
      </div>
    </StepShell>
  )
}
