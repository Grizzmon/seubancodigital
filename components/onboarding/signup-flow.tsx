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
import { TransitionScreen } from './transition-screen'
import { ProcessingScreen, useTimedProgress } from './processing-screen'
import { TIMING } from '@/lib/timing'
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
  'opening',
  'accountOpen',
  'txPin',
  'wallets',
] as const

type Step = (typeof STEPS)[number]

// Telas em que não faz sentido voltar (processos já concluídos).
const NO_BACK: Step[] = ['processing', 'approved', 'pin6', 'opening', 'accountOpen', 'txPin', 'wallets']

// Telas que já são um "processamento": não precisam da tela de transição antes.
const LOADER_STEPS: Step[] = ['processing', 'opening']

// Mensagem da tela de transição, de acordo com a tela para onde o usuário vai.
const TRANSITION_MESSAGES: Partial<Record<Step, string>> = {
  email: 'Validando o seu número de celular...',
  name: 'Confirmando o seu e-mail...',
  leadConfirm: 'Guardando os seus dados com segurança...',
  reasons: 'Registando o seu aceite...',
  pin6: 'Preparando a segurança da sua conta...',
  birth: 'Senha guardada. Continuando o cadastro...',
  mother: 'Confirmando a sua data de nascimento...',
  province: 'Verificando as suas informações...',
  income: 'Localizando a sua província...',
  occupation: 'Analisando o seu perfil financeiro...',
  docType: 'Preparando a verificação de identidade...',
  docInstructions: 'Configurando a leitura do documento...',
  docFront: 'Preparando a câmera...',
  docBack: 'Frente do documento recebida. Agora o verso...',
  txPin: 'Ativando a sua conta...',
  wallets: 'Buscando carteiras móveis disponíveis...',
}

const PROCESSING_MESSAGES = [
  'Validando os dados informados',
  'Consultando bases de segurança',
  'Verificando o número de celular',
  'Criando o seu cadastro',
  'Aguardando aprovação',
] as const

const OPENING_MESSAGES = [
  'Analisando as fotos do documento',
  'Confirmando a sua identidade',
  'Gerando o número da sua conta',
  'Habilitando o Pix internacional',
  'Finalizando a abertura',
] as const

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

  // Tela para onde estamos indo enquanto a transição "Verificando..." é exibida.
  const [transitionTo, setTransitionTo] = useState<Step | null>(null)
  const [registered, setRegistered] = useState(false)
  const [approvedReady, setApprovedReady] = useState(false)

  const step = STEPS[index]
  const phoneDigits = phone.replace(/\D/g, '')
  const userFirstName = useMemo(() => capitalizeWords(firstName(name)), [name])

  const jumpTo = (target: Step, dir: 'forward' | 'backward') => {
    setDirection(dir)
    setIndex(STEPS.indexOf(target))
  }

  // Avançar mostra a tela de transição por alguns segundos antes da próxima seção.
  const next = () => {
    const target = STEPS[Math.min(index + 1, STEPS.length - 1)]
    if (LOADER_STEPS.includes(target)) {
      jumpTo(target, 'forward')
      return
    }
    setTransitionTo(target)
  }
  // Voltar é imediato.
  const back = () => (index === 0 ? onExit() : jumpTo(STEPS[index - 1], 'backward'))
  const canGoBack = !NO_BACK.includes(step)

  useEffect(() => {
    if (!transitionTo) return
    const timer = window.setTimeout(() => {
      jumpTo(transitionTo, 'forward')
      setTransitionTo(null)
    }, TIMING.stepTransition)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionTo])

  // TELA 7: o usuário é criado no servidor enquanto a barra avança
  // (isso dispara a notificação "conta aprovada" para quem permitiu push).
  const processingProgress = useTimedProgress(step === 'processing', TIMING.processingData, registered)
  useEffect(() => {
    if (step !== 'processing') return
    let cancelled = false
    setRegistered(false)

    const params = new URLSearchParams(window.location.search)
    const isVip = params.get('acesso') === 'vip' || params.get('plano') === 'vip'

    registerUserAndLinkPush({
      name: capitalizeWords(name.trim()),
      phone: phoneDigits,
      accessType: isVip ? 'VIP' : 'FREE',
      newAccount: true,
    })
      .catch(() => null)
      .then(() => {
        if (!cancelled) setRegistered(true)
      })

    return () => {
      cancelled = true
    }
  }, [step, name, phoneDigits])

  useEffect(() => {
    if (step !== 'processing' || processingProgress < 100) return
    const timer = window.setTimeout(() => jumpTo('approved', 'forward'), 900)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, processingProgress])

  // TELA "Cadastro aprovado": o botão só aparece depois da animação de revelação.
  useEffect(() => {
    if (step !== 'approved') return
    setApprovedReady(false)
    const timer = window.setTimeout(() => setApprovedReady(true), TIMING.approvedReveal)
    return () => window.clearTimeout(timer)
  }, [step])

  // Abertura da conta depois das fotos do documento.
  const openingProgress = useTimedProgress(step === 'opening', TIMING.accountOpening)
  useEffect(() => {
    if (step !== 'opening' || openingProgress < 100) return
    const timer = window.setTimeout(() => jumpTo('accountOpen', 'forward'), 900)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, openingProgress])

  if (transitionTo) {
    return (
      <TransitionScreen
        message={TRANSITION_MESSAGES[transitionTo] ?? 'Verificando as suas informações...'}
        durationMs={TIMING.stepTransition}
      />
    )
  }

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
        <ProcessingScreen
          key={step}
          title="Enviando seus dados..."
          subtitle="Estamos preparando a sua conta RealPayz. Não feche o app."
          messages={PROCESSING_MESSAGES}
          progress={processingProgress}
        />
      )

    case 'opening':
      return (
        <ProcessingScreen
          key={step}
          title={<>Vamos abrir a sua conta agora, {userFirstName}.</>}
          subtitle="Estamos concluindo a verificação da sua identidade."
          messages={OPENING_MESSAGES}
          progress={openingProgress}
        />
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
              <span className="mx-auto flex items-center gap-2 rounded-full bg-success/10 px-4 py-1.5 text-sm font-semibold text-success animate-pop-in [animation-delay:600ms]">
                <CheckCircle2 className="h-4 w-4" /> Cadastro aprovado
              </span>
              <h1 className="text-balance text-3xl font-bold leading-tight text-foreground animate-fade-in [animation-delay:1200ms]">
                Bem-vindo à sua Conta RealPayz, {userFirstName}.
              </h1>
              <p className="text-pretty text-muted-foreground animate-fade-in [animation-delay:1800ms]">
                Agora vamos configurar a segurança e concluir a verificação da sua identidade.
              </p>
            </div>
            <div className="min-h-14">
              {approvedReady ? (
                <div className="animate-pop-in">
                  <PrimaryButton onClick={next}>
                    Continuar cadastro <ArrowRight className="h-5 w-5" />
                  </PrimaryButton>
                </div>
              ) : (
                <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary animate-soft-pulse" /> Preparando as próximas etapas...
                </p>
              )}
            </div>
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
