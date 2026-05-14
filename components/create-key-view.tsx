'use client'

import { useState, useEffect } from 'react'
import { KeyRound, CheckCircle, Hash, Phone, ArrowLeft, Copy, Check } from 'lucide-react'
import { type PixKey, generateCPF, generateCelular } from '@/lib/store'

interface CreateKeyViewProps {
  userName: string
  onAddKey: (key: PixKey) => void
  onBack: () => void
}

type KeyType = 'cpf' | 'celular'

const loadingMessages = [
  'Gerando sua chave...',
  'Conectando sua chave...',
  'Ligando com o Banco Central...',
  'Nao saia do app...',
  'Validando informacoes...',
  'Finalizando cadastro...'
]

export function CreateKeyView({ userName, onAddKey, onBack }: CreateKeyViewProps) {
  const [name, setName] = useState('')
  const [keyType, setKeyType] = useState<KeyType>('cpf')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [success, setSuccess] = useState<{ name: string; value: string; type: KeyType } | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Cycle through loading messages every 2.5 seconds for 15 second total
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length)
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [isLoading])

  const handleCopy = async () => {
    if (success) {
      try {
        const textToCopy = `${success.name}\n${success.type === 'cpf' ? 'CPF' : 'CELULAR'}: ${success.value}\nBANCO: BANKPIX SSA`
        await navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Digite seu nome completo')
      return
    }

    const names = name.trim().split(/\s+/)
    if (names.length < 2) {
      setError('Digite nome e sobrenome')
      return
    }

    setIsLoading(true)
    setLoadingMessageIndex(0)

    // Simulate processing (15 seconds)
    await new Promise(resolve => setTimeout(resolve, 15000))

    const keyValue = keyType === 'cpf' ? generateCPF() : generateCelular()

    const newKey: PixKey = {
      id: crypto.randomUUID(),
      name: name.trim().toUpperCase(),
      type: keyType,
      value: keyValue,
      createdAt: new Date()
    }

    onAddKey(newKey)
    setIsLoading(false)
    setSuccess({ name: name.trim().toUpperCase(), value: keyValue, type: keyType })
  }

  const handleDismissSuccess = () => {
    setSuccess(null)
    setName('')
    setCopied(false)
    onBack()
  }

  const handleCreateAnother = () => {
    setSuccess(null)
    setName('')
    setCopied(false)
  }

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md animate-fade-in">
          <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-card border border-border shadow-2xl animate-slide-up w-full max-w-sm mx-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-primary/20 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-2 transition-all duration-300">
                {loadingMessages[loadingMessageIndex]}
              </h3>
              <p className="text-muted-foreground text-sm">Aguarde um momento</p>
            </div>
            {/* Progress dots */}
            <div className="flex gap-2">
              {loadingMessages.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === loadingMessageIndex ? 'bg-primary scale-125' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md animate-fade-in p-4">
          <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-2xl animate-slide-up">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6 animate-pulse-glow">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Chave criada com sucesso!
              </h3>
              <p className="text-muted-foreground mb-6">
                Agora voce pode usar para receber seu dinheiro
              </p>
              
              {/* Key Details */}
              <div className="w-full p-5 rounded-xl bg-muted/50 border border-border mb-6 space-y-3 text-left">
                <p className="font-bold text-foreground text-lg uppercase">{success.name}</p>
                <p className="text-foreground">
                  {success.type === 'cpf' ? 'CPF' : 'CELULAR'}: <span className="font-mono">{success.value}</span>
                </p>
                <p className="text-foreground">
                  BANCO: <span className="font-semibold text-primary">BANKPIX SSA</span>
                </p>
              </div>

              <div className="w-full space-y-3">
                <button
                  onClick={handleCopy}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                    copied
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copiado!' : 'Copiar Chave'}
                </button>
                <button
                  onClick={handleDismissSuccess}
                  className="w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  Voltar ao Dashboard
                </button>
                <button
                  onClick={handleCreateAnother}
                  className="w-full px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors"
                >
                  Gerar Nova Chave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-fade-in">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Criar Chave Pix</h1>
            <p className="text-muted-foreground mt-1">
              Gere uma nova chave para receber transferencias
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label htmlFor="keyName" className="block text-sm font-medium text-foreground mb-2">
                Nome completo
              </label>
              <input
                id="keyName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                placeholder="Digite seu nome completo"
                className="w-full px-4 py-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-lg uppercase"
              />
            </div>

            {/* Key Type Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Tipo de chave
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setKeyType('cpf')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    keyType === 'cpf'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${keyType === 'cpf' ? 'bg-primary/20' : 'bg-muted'}`}>
                      <Hash className={`w-6 h-6 ${keyType === 'cpf' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-left">
                      <span className={`font-semibold ${keyType === 'cpf' ? 'text-primary' : 'text-foreground'}`}>CPF</span>
                      <p className="text-xs text-muted-foreground">XXX.XXX.XXX-XX</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setKeyType('celular')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    keyType === 'celular'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${keyType === 'celular' ? 'bg-primary/20' : 'bg-muted'}`}>
                      <Phone className={`w-6 h-6 ${keyType === 'celular' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-left">
                      <span className={`font-semibold ${keyType === 'celular' ? 'text-primary' : 'text-foreground'}`}>Celular</span>
                      <p className="text-xs text-muted-foreground">11 digitos</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              <KeyRound className="w-5 h-5" />
              Gerar Chave
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="bg-muted/30 rounded-xl border border-border p-5">
          <h4 className="font-semibold text-foreground mb-3">Sobre as chaves</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">*</span>
              <span>CPF: Formato XXX.XXX.XXX-XX (11 digitos)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">*</span>
              <span>Celular: 11 digitos aleatorios</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">*</span>
              <span>Vinculado ao BANKPIX SSA</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
