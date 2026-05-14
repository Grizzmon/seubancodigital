'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Key, CheckCircle, Copy, Smartphone, CreditCard, AlertTriangle, Play, Lock, Mail, Hash } from 'lucide-react'
import { type PixKey, generateCPF } from '@/lib/store'

const loadingMessages = [
  'Gerando sua chave...',
  'Conectando sua chave...',
  'Ligando com o Banco Central...',
  'Nao saia do app...',
  'Validando informacoes...',
  'Finalizando cadastro...'
]

interface CreateKeyViewProps {
  userName: string
  onCreateKey: (key: PixKey) => void
  onBack: () => void
}

// Function to generate Brazilian phone number +5511 or +5519 + 9 random digits
function generateBrazilianPhone(): string {
  const prefixes = ['11', '19', '21', '31', '41', '51', '61', '71', '81', '85']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('')
  return `+55${prefix}${number}`
}

// Function to generate 32 character alphanumeric key
function generateRandomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// Function to mask CPF: 072.678.980-96 -> 072.***.***-96
function maskCPF(cpf: string): string {
  const parts = cpf.split('.')
  if (parts.length === 3) {
    const lastPart = parts[2].split('-')
    return `${parts[0]}.***.***-${lastPart[1]}`
  }
  return cpf
}

// Function to mask Phone: +5511987654321 -> +5511****4321
function maskPhone(phone: string): string {
  if (phone.length >= 13) {
    return `${phone.slice(0, 5)}*****${phone.slice(-4)}`
  }
  return phone
}

// Function to mask Random Key: abc123...xyz789 -> abc1****xyz7
function maskRandomKey(key: string): string {
  if (key.length >= 32) {
    return `${key.slice(0, 4)}************************${key.slice(-4)}`
  }
  return key
}

export function CreateKeyView({ userName, onCreateKey, onBack }: CreateKeyViewProps) {
  const [keyName, setKeyName] = useState('')
  const [keyType, setKeyType] = useState<'cpf' | 'celular' | 'aleatorio' | 'email'>('cpf')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [success, setSuccess] = useState<{ name: string; type: 'cpf' | 'celular' | 'aleatorio' | 'email'; value: string; maskedValue: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  const [showEmailWarning, setShowEmailWarning] = useState(false)

  // Cycle through loading messages every 1.6 seconds for 10 second total
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length)
      }, 1600)
      return () => clearInterval(interval)
    }
  }, [isLoading])

  const handleActivateAccount = () => {
    // Fire Meta Pixel custom event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'clicou_ativar')
    }
    // Redirect to VSL page
    window.location.href = 'https://loteriasegredo.com/desbloquei-seu-app/'
  }

  const handleSelectKeyType = (type: 'cpf' | 'celular' | 'aleatorio' | 'email') => {
    setKeyType(type)
    
    // Se for email, mostrar aviso de ativacao imediatamente
    if (type === 'email') {
      setShowEmailWarning(true)
    } else {
      setShowEmailWarning(false)
    }
  }

  const handleGenerateKey = async () => {
    if (!keyName.trim()) {
      alert('Digite um nome para sua chave')
      return
    }

    setIsLoading(true)
    setLoadingMessageIndex(0)

    // Simulate processing (10 seconds)
    await new Promise(resolve => setTimeout(resolve, 10000))

    let value = ''
    let maskedValue = ''

    switch (keyType) {
      case 'cpf':
        value = generateCPF()
        maskedValue = maskCPF(value)
        break
      case 'celular':
        value = generateBrazilianPhone()
        maskedValue = maskPhone(value)
        break
      case 'aleatorio':
        value = generateRandomKey()
        maskedValue = maskRandomKey(value)
        break
      default:
        value = generateCPF()
        maskedValue = maskCPF(value)
    }
    
    const newKey: PixKey = {
      id: `key-${Date.now()}`,
      name: keyName.toUpperCase(),
      type: keyType === 'email' ? 'cpf' : keyType,
      value: value,
      createdAt: new Date()
    }

    onCreateKey(newKey)
    setSuccess({ name: keyName.toUpperCase(), type: keyType, value, maskedValue })
    setIsLoading(false)
    
    // Show limit warning after 2 seconds
    setTimeout(() => {
      setShowLimitWarning(true)
    }, 2000)
  }

  const handleCopy = async () => {
    if (success) {
      const typeLabel = success.type === 'cpf' ? 'CPF' : success.type === 'celular' ? 'CELULAR' : 'CHAVE'
      const textToCopy = `${success.name}\n${typeLabel}: ${success.maskedValue}\nBANCO: BANKPIX SSA`
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Key className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">
              {loadingMessages[loadingMessageIndex]}
            </p>
            <p className="text-sm text-muted-foreground">Nao feche o aplicativo</p>
          </div>
        </div>
      </div>
    )
  }

  // Success State with Limit Warning
  if (success) {
    const typeLabel = success.type === 'cpf' ? 'CPF' : success.type === 'celular' ? 'CELULAR' : 'CHAVE ALEATORIA'
    
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Success Card */}
          <div className="flex flex-col items-center text-center animate-slide-up">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Chave cadastrada com sucesso!
            </h3>
            <p className="text-muted-foreground mb-6">
              Sua chave PIX foi gerada
            </p>

            {/* Key Details */}
            <div className="w-full p-5 rounded-xl bg-muted/50 border border-border mb-4 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tipo de Chave:</span>
                <span className="font-semibold text-foreground">{typeLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Titular:</span>
                <span className="font-semibold text-foreground">{success.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{typeLabel}:</span>
                <span className="font-mono text-foreground text-sm">{success.maskedValue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Banco:</span>
                <span className="font-semibold text-primary">BANKPIX SSA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status:</span>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/30">
                  <Lock className="w-3 h-3 text-red-500" />
                  <span className="text-xs font-semibold text-red-500">INATIVO</span>
                </div>
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-muted border border-border text-foreground font-medium hover:bg-muted/80 transition-all mb-4"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copiado!' : 'Copiar chave'}
            </button>

            {/* Limit Warning */}
            {showLimitWarning && (
              <div className="w-full p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h4 className="font-semibold text-yellow-500 mb-1">Conta com Limitacao</h4>
                    <p className="text-sm text-muted-foreground">
                      Sua conta esta no nivel BASICO. Ative sua conta para poder usar o aplicativo e as chaves PIX!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleActivateAccount}
                  className="w-full flex items-center justify-center gap-2 mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all"
                >
                  <Play className="w-5 h-5" />
                  Ver video e ativar
                </button>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao menu principal
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Email Warning Modal
  if (showEmailWarning) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center animate-slide-up">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 mb-6">
              <AlertTriangle className="w-10 h-10 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Chave Email Indisponivel
            </h3>
            <p className="text-muted-foreground mb-6">
              Para cadastrar chave por Email, voce precisa ativar sua conta primeiro. Sua conta esta no nivel BASICO e nao permite esse tipo de chave.
            </p>

            <div className="w-full p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6">
              <p className="text-sm text-muted-foreground mb-4">
                Ative sua conta para desbloquear:
              </p>
              <ul className="text-sm text-left text-muted-foreground space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-yellow-500" />
                  Chave PIX por Email
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-yellow-500" />
                  Receber transferencias
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-yellow-500" />
                  Saques via M-Pesa e e-Mola
                </li>
              </ul>
            </div>

            <button
              onClick={handleActivateAccount}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 mb-4"
            >
              <Play className="w-5 h-5" />
              Ver video e ativar
            </button>

            <button
              onClick={() => {
                setShowEmailWarning(false)
                setKeyType('cpf')
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar e escolher outro tipo
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Form State
  return (
    <div className="p-4 lg:p-6 pt-20 lg:pt-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cadastrar Chave PIX</h1>
          <p className="text-muted-foreground">Crie uma nova chave para receber pagamentos</p>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* Key Name Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nome da Chave
          </label>
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Escolha qualquer nome para sua chave"
            className="w-full p-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase"
          />
          <p className="text-xs text-muted-foreground mt-2">Ex: MEU PIX PRINCIPAL, CONTA PESSOAL, TRABALHO...</p>
        </div>

        {/* Key Type Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Tipo de Chave
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSelectKeyType('cpf')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                keyType === 'cpf'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <CreditCard className={`w-7 h-7 ${keyType === 'cpf' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium text-sm ${keyType === 'cpf' ? 'text-primary' : 'text-foreground'}`}>CPF</span>
            </button>
            <button
              onClick={() => handleSelectKeyType('celular')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                keyType === 'celular'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Smartphone className={`w-7 h-7 ${keyType === 'celular' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium text-sm ${keyType === 'celular' ? 'text-primary' : 'text-foreground'}`}>Celular</span>
            </button>
            <button
              onClick={() => handleSelectKeyType('aleatorio')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                keyType === 'aleatorio'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Hash className={`w-7 h-7 ${keyType === 'aleatorio' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium text-sm ${keyType === 'aleatorio' ? 'text-primary' : 'text-foreground'}`}>Aleatoria</span>
            </button>
            <button
              onClick={() => handleSelectKeyType('email')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all relative ${
                keyType === 'email'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Lock className="w-3 h-3 text-yellow-500 absolute top-2 right-2" />
              <Mail className={`w-7 h-7 ${keyType === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium text-sm ${keyType === 'email' ? 'text-primary' : 'text-foreground'}`}>Email</span>
            </button>
          </div>
        </div>

        {/* Key Format Preview */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground mb-2">Formato da chave:</p>
          <p className="font-mono text-sm text-foreground">
            {keyType === 'cpf' && 'XXX.***.***-XX'}
            {keyType === 'celular' && '+55XX*****XXXX'}
            {keyType === 'aleatorio' && 'XXXX************************XXXX'}
            {keyType === 'email' && 'Requer ativacao da conta'}
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateKey}
          disabled={!keyName.trim() || keyType === 'email'}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Key className="w-5 h-5" />
          Gerar Chave PIX
        </button>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          Ao gerar a chave, ela sera vinculada ao Banco Central do Brasil
        </p>
      </div>
    </div>
  )
}
