'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Key, CheckCircle, Copy, Smartphone, CreditCard, AlertTriangle, Play } from 'lucide-react'
import { type PixKey, generateCPF, generateCelular } from '@/lib/store'

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

// Function to mask CPF: 072.678.980-96 -> 072.***.***-96
function maskCPF(cpf: string): string {
  const parts = cpf.split('.')
  if (parts.length === 3) {
    const lastPart = parts[2].split('-')
    return `${parts[0]}.***.***-${lastPart[1]}`
  }
  return cpf
}

// Function to mask Celular: (84)927361054 -> (84)***361054
function maskCelular(celular: string): string {
  const match = celular.match(/$$(\d{2})$$(\d{9})/)
  if (match) {
    const ddd = match[1]
    const number = match[2]
    return `(${ddd})***${number.slice(3)}`
  }
  return celular
}

export function CreateKeyView({ userName, onCreateKey, onBack }: CreateKeyViewProps) {
  const [keyType, setKeyType] = useState<'cpf' | 'celular'>('cpf')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [success, setSuccess] = useState<{ name: string; type: 'cpf' | 'celular'; value: string; maskedValue: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showLimitWarning, setShowLimitWarning] = useState(false)

  // Cycle through loading messages every 2.5 seconds for 15 second total
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length)
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [isLoading])

  const handleGenerateKey = async () => {
    setIsLoading(true)
    setLoadingMessageIndex(0)

    // Simulate processing (15 seconds)
    await new Promise(resolve => setTimeout(resolve, 15000))

    const value = keyType === 'cpf' ? generateCPF() : generateCelular()
    const maskedValue = keyType === 'cpf' ? maskCPF(value) : maskCelular(value)
    
    const newKey: PixKey = {
      id: `key-${Date.now()}`,
      name: userName.toUpperCase(),
      type: keyType,
      value: value,
      createdAt: new Date()
    }

    onCreateKey(newKey)
    setSuccess({ name: userName.toUpperCase(), type: keyType, value, maskedValue })
    setIsLoading(false)
    
    // Show limit warning after 2 seconds
    setTimeout(() => {
      setShowLimitWarning(true)
    }, 2000)
  }

  const handleCopy = async () => {
    if (success) {
      const textToCopy = `${success.name}\n${success.type === 'cpf' ? 'CPF' : 'CELULAR'}: ${success.maskedValue}\nBANCO: BANKPIX SSA`
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleActivateAccount = () => {
    // Fire Meta Pixel custom event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'clicou_ativar')
    }
    // Redirect to VSL page
    window.location.href = 'https://loteriasegredo.com/desbloquei-seu-app/'
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
                <span className="font-semibold text-foreground">{success.type === 'cpf' ? 'CPF' : 'CELULAR'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Titular:</span>
                <span className="font-semibold text-foreground">{success.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{success.type === 'cpf' ? 'CPF' : 'CELULAR'}:</span>
                <span className="font-mono text-foreground">{success.maskedValue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Banco:</span>
                <span className="font-semibold text-primary">BANKPIX SSA</span>
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

  // Form State
  return (
    <div className="p-4 lg:p-6 pt-20 lg:pt-6">
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
        {/* Key Type Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Tipo de Chave
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setKeyType('cpf')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                keyType === 'cpf'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <CreditCard className={`w-8 h-8 ${keyType === 'cpf' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium ${keyType === 'cpf' ? 'text-primary' : 'text-foreground'}`}>CPF</span>
            </button>
            <button
              onClick={() => setKeyType('celular')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                keyType === 'celular'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Smartphone className={`w-8 h-8 ${keyType === 'celular' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium ${keyType === 'celular' ? 'text-primary' : 'text-foreground'}`}>Celular</span>
            </button>
          </div>
        </div>

        {/* Titular Name Display */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Titular
          </label>
          <div className="p-4 rounded-xl bg-muted border border-border">
            <p className="font-semibold text-foreground uppercase">{userName}</p>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateKey}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
        >
          <Key className="w-5 h-5" />
          Gerar Chave PIX
        </button>
      </div>
    </div>
  )
}
