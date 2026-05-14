'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Key, CheckCircle, Copy, Smartphone, CreditCard, AlertTriangle, Play, Lock, Mail, Hash } from 'lucide-react'
import { type PixKey } from '@/lib/store'

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
  onAddKey: (key: PixKey) => void
  onBack: () => void
}

function generateCPF(): string {
  const rand = (max: number) => Math.floor(Math.random() * max)
  const n = Array.from({ length: 9 }, () => rand(9))
  let d1 = n.reduce((acc, val, i) => acc + val * (10 - i), 0) % 11
  d1 = d1 < 2 ? 0 : 11 - d1
  let d2 = (n.reduce((acc, val, i) => acc + val * (11 - i), 0) + d1 * 2) % 11
  d2 = d2 < 2 ? 0 : 11 - d2
  return `${n.slice(0,3).join('')}.${n.slice(3,6).join('')}.${n.slice(6,9).join('')}-${d1}${d2}`
}

function generateBrazilianPhone(): string {
  const prefixes = ['11', '19', '21', '31', '41', '51', '61', '71', '81', '85']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('')
  return `+55${prefix}${number}`
}

function generateRandomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function maskCPF(cpf: string): string {
  const parts = cpf.split('.')
  if (parts.length === 3) {
    const lastPart = parts[2].split('-')
    return `${parts[0]}.***.***-${lastPart[1]}`
  }
  return cpf
}

function maskPhone(phone: string): string {
  if (phone.length >= 13) {
    return `${phone.slice(0, 5)}*****${phone.slice(-4)}`
  }
  return phone
}

function maskRandomKey(key: string): string {
  if (key.length >= 32) {
    return `${key.slice(0, 4)}************************${key.slice(-4)}`
  }
  return key
}

export function CreateKeyView({ userName, onAddKey, onBack }: CreateKeyViewProps) {
  const [keyName, setKeyName] = useState('')
  const [keyType, setKeyType] = useState<'cpf' | 'celular' | 'aleatorio' | 'email'>('cpf')
  const [viewState, setViewState] = useState<'form' | 'loading' | 'success' | 'email-warning'>('form')
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [successData, setSuccessData] = useState<{ name: string; type: string; maskedValue: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
      if (messageTimerRef.current) clearInterval(messageTimerRef.current)
    }
  }, [])

  const handleActivateAccount = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'clicou_ativar')
    }
    window.location.href = 'https://loteriasegredo.com/desbloquei-seu-app/'
  }

  const handleSelectKeyType = (type: 'cpf' | 'celular' | 'aleatorio' | 'email') => {
    setKeyType(type)
    if (type === 'email') {
      setViewState('email-warning')
    }
  }

  const handleGenerateKey = () => {
    if (!keyName.trim()) {
      alert('Digite um nome para sua chave')
      return
    }

    // Start loading
    setViewState('loading')
    setLoadingMessageIndex(0)

    // Cycle messages
    messageTimerRef.current = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length)
    }, 1500)

    // Finish after 10 seconds
    loadingTimerRef.current = setTimeout(() => {
      if (messageTimerRef.current) clearInterval(messageTimerRef.current)
      
      let value = ''
      let maskedValue = ''

      if (keyType === 'cpf') {
        value = generateCPF()
        maskedValue = maskCPF(value)
      } else if (keyType === 'celular') {
        value = generateBrazilianPhone()
        maskedValue = maskPhone(value)
      } else {
        value = generateRandomKey()
        maskedValue = maskRandomKey(value)
      }

      const newKey: PixKey = {
        id: `key-${Date.now()}`,
        name: keyName.trim().toUpperCase(),
        type: keyType,
        value: value,
        createdAt: new Date()
      }

      onAddKey(newKey)
      
      setSuccessData({
        name: keyName.trim().toUpperCase(),
        type: keyType,
        maskedValue
      })
      
      setViewState('success')
      
      // Show warning after 2s
      setTimeout(() => setShowLimitWarning(true), 2000)
    }, 10000)
  }

  const handleCopy = () => {
    if (!successData) return
    const typeLabel = successData.type === 'cpf' ? 'CPF' : successData.type === 'celular' ? 'CELULAR' : 'CHAVE'
    const textToCopy = `${successData.name}\n${typeLabel}: ${successData.maskedValue}\nBANCO: BANKPIX SSA`
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ONLINE INDICATOR - Para confirmar atualizacao
  const OnlineIndicator = () => (
    <div className="fixed top-2 right-2 z-[999] flex items-center gap-1.5 px-2 py-1 bg-black/80 rounded-full">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="text-[10px] text-green-500 font-bold">ONLINE v2</span>
    </div>
  )

  // Loading
  if (viewState === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <OnlineIndicator />
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

  // Success
  if (viewState === 'success' && successData) {
    const typeLabel = successData.type === 'cpf' ? 'CPF' : successData.type === 'celular' ? 'CELULAR' : 'CHAVE ALEATORIA'
    
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 pt-20 lg:pt-4">
        <OnlineIndicator />
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Chave cadastrada!</h3>
            <p className="text-muted-foreground mb-6">Sua chave PIX foi gerada</p>

            <div className="w-full p-5 rounded-xl bg-muted/50 border border-border mb-4 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <span className="font-semibold text-foreground">{typeLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Titular:</span>
                <span className="font-semibold text-foreground">{successData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Chave:</span>
                <span className="font-mono text-foreground text-xs">{successData.maskedValue}</span>
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

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-muted border border-border text-foreground font-medium mb-4"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copiado!' : 'Copiar chave'}
            </button>

            {showLimitWarning && (
              <div className="w-full p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="font-semibold text-yellow-500 mb-1">Conta Limitada</h4>
                    <p className="text-sm text-muted-foreground">
                      Sua conta esta no nivel BASICO. Ative para usar suas chaves PIX!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleActivateAccount}
                  className="w-full flex items-center justify-center gap-2 mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
                >
                  <Play className="w-5 h-5" />
                  Ver video e ativar
                </button>
              </div>
            )}

            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-muted-foreground font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Email Warning
  if (viewState === 'email-warning') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 pt-20 lg:pt-4">
        <OnlineIndicator />
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 mb-6">
              <AlertTriangle className="w-10 h-10 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Email Indisponivel</h3>
            <p className="text-muted-foreground mb-6">
              Ative sua conta para cadastrar chave por Email.
            </p>

            <div className="w-full p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6">
              <p className="text-sm text-muted-foreground mb-4">Ative para desbloquear:</p>
              <ul className="text-sm text-left text-muted-foreground space-y-2">
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
                  Saques M-Pesa e e-Mola
                </li>
              </ul>
            </div>

            <button
              onClick={handleActivateAccount}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg mb-4"
            >
              <Play className="w-5 h-5" />
              Ver video e ativar
            </button>

            <button
              onClick={() => {
                setViewState('form')
                setKeyType('cpf')
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-muted-foreground font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Form
  return (
    <div className="p-4 lg:p-6 pt-20 lg:pt-6 pb-20">
      <OnlineIndicator />
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 rounded-lg bg-muted hover:bg-muted/80">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cadastrar Chave PIX</h1>
          <p className="text-muted-foreground">Crie uma nova chave</p>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Nome da Chave</label>
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Escolha qualquer nome para sua chave"
            className="w-full p-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
          />
          <p className="text-xs text-muted-foreground mt-2">Ex: MEU PIX, CONTA PESSOAL...</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Tipo de Chave</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSelectKeyType('cpf')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${
                keyType === 'cpf' ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <CreditCard className={`w-7 h-7 ${keyType === 'cpf' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium text-sm ${keyType === 'cpf' ? 'text-primary' : 'text-foreground'}`}>CPF</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleSelectKeyType('celular')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${
                keyType === 'celular' ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <Smartphone className={`w-7 h-7 ${keyType === 'celular' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium text-sm ${keyType === 'celular' ? 'text-primary' : 'text-foreground'}`}>Celular</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleSelectKeyType('aleatorio')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${
                keyType === 'aleatorio' ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <Hash className={`w-7 h-7 ${keyType === 'aleatorio' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium text-sm ${keyType === 'aleatorio' ? 'text-primary' : 'text-foreground'}`}>Aleatoria</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleSelectKeyType('email')}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${
                keyType === 'email' ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <Lock className="w-3 h-3 text-yellow-500 absolute top-2 right-2" />
              <Mail className={`w-7 h-7 ${keyType === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium text-sm ${keyType === 'email' ? 'text-primary' : 'text-foreground'}`}>Email</span>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground mb-2">Formato:</p>
          <p className="font-mono text-sm text-foreground">
            {keyType === 'cpf' && 'XXX.***.***-XX'}
            {keyType === 'celular' && '+55XX*****XXXX'}
            {keyType === 'aleatorio' && 'XXXX********************XXXX'}
            {keyType === 'email' && 'Requer ativacao'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateKey}
          disabled={!keyName.trim() || keyType === 'email'}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Key className="w-5 h-5" />
          Gerar Chave PIX
        </button>

        <p className="text-xs text-center text-muted-foreground">
          Vinculada ao Banco Central do Brasil
        </p>
      </div>
    </div>
  )
}
