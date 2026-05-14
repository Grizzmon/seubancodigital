'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Key, CheckCircle, Copy, Smartphone, CreditCard, AlertTriangle, Play, Lock, Mail, Hash } from 'lucide-react'
import { type PixKey } from '@/lib/store'

interface CreateKeyViewProps {
  userName: string
  onAddKey: (key: PixKey) => void
  onBack: () => void
}

function generateCPF(): string {
  const n1 = Math.floor(Math.random() * 900) + 100
  const n2 = Math.floor(Math.random() * 900) + 100
  const n3 = Math.floor(Math.random() * 900) + 100
  const d = Math.floor(Math.random() * 90) + 10
  return `${n1}.${n2}.${n3}-${d}`
}

function generatePhone(): string {
  const ddd = ['11', '19', '21', '31', '41', '51'][Math.floor(Math.random() * 6)]
  const num = Math.floor(Math.random() * 900000000) + 100000000
  return `+55${ddd}${num}`
}

function generateRandom(): string {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let r = ''
  for (let i = 0; i < 32; i++) r += c[Math.floor(Math.random() * c.length)]
  return r
}

function maskCPF(v: string): string {
  const p = v.split('.')
  if (p.length === 3) return `${p[0]}.***.***-${p[2].split('-')[1]}`
  return v
}

function maskPhone(v: string): string {
  return v.length >= 13 ? `${v.slice(0, 5)}*****${v.slice(-4)}` : v
}

function maskRandom(v: string): string {
  return v.length >= 32 ? `${v.slice(0, 4)}************************${v.slice(-4)}` : v
}

export function CreateKeyView({ userName, onAddKey, onBack }: CreateKeyViewProps) {
  const [keyName, setKeyName] = useState('')
  const [keyType, setKeyType] = useState<'cpf' | 'celular' | 'aleatorio' | 'email'>('cpf')
  const [screen, setScreen] = useState<'form' | 'loading' | 'success' | 'email'>('form')
  const [msgIndex, setMsgIndex] = useState(0)
  const [result, setResult] = useState<{ name: string; type: string; masked: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showWarn, setShowWarn] = useState(false)
  const [counter, setCounter] = useState(5)

  const msgs = ['Gerando chave...', 'Conectando...', 'Banco Central...', 'Validando...', 'Finalizando...']

  // Contador e mensagens durante loading
  useEffect(() => {
    if (screen !== 'loading') return

    const msgTimer = setInterval(() => {
      setMsgIndex(i => (i + 1) % msgs.length)
    }, 1000)

    const countTimer = setInterval(() => {
      setCounter(c => {
        if (c <= 1) {
          // Gerar chave
          let val = '', masked = ''
          if (keyType === 'cpf') {
            val = generateCPF()
            masked = maskCPF(val)
          } else if (keyType === 'celular') {
            val = generatePhone()
            masked = maskPhone(val)
          } else {
            val = generateRandom()
            masked = maskRandom(val)
          }

          const newKey: PixKey = {
            id: `key-${Date.now()}`,
            name: keyName.trim().toUpperCase(),
            type: keyType,
            value: val,
            createdAt: new Date()
          }

          onAddKey(newKey)
          setResult({ name: keyName.trim().toUpperCase(), type: keyType, masked })
          setScreen('success')
          
          setTimeout(() => setShowWarn(true), 1500)
          
          return 5
        }
        return c - 1
      })
    }, 1000)

    return () => {
      clearInterval(msgTimer)
      clearInterval(countTimer)
    }
  }, [screen, keyType, keyName, onAddKey])

  const handleActivate = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'clicou_ativar')
    }
    window.location.href = 'https://loteriasegredo.com/desbloquei-seu-app/'
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(`${result.name}\n${result.type.toUpperCase()}: ${result.masked}\nBANCO: BANKPIX SSA`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerate = () => {
    if (!keyName.trim()) {
      alert('Digite um nome')
      return
    }
    setCounter(5)
    setMsgIndex(0)
    setScreen('loading')
  }

  // Indicador ONLINE
  const Online = () => (
    <div className="fixed top-2 right-2 z-[999] flex items-center gap-1 px-2 py-1 bg-black rounded-full">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="text-[10px] text-green-400 font-bold">v3</span>
    </div>
  )

  // LOADING
  if (screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Online />
        <div className="text-center">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Key className="w-8 h-8 text-primary" />
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground mb-1">{msgs[msgIndex]}</p>
          <p className="text-sm text-muted-foreground">Aguarde {counter}s</p>
        </div>
      </div>
    )
  }

  // SUCCESS
  if (screen === 'success' && result) {
    const label = result.type === 'cpf' ? 'CPF' : result.type === 'celular' ? 'CELULAR' : 'ALEATORIA'
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Online />
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Chave Criada!</h2>
          </div>

          <div className="p-4 rounded-xl bg-muted border border-border mb-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tipo:</span>
              <span className="font-semibold text-foreground">{label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Titular:</span>
              <span className="font-semibold text-foreground">{result.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Chave:</span>
              <span className="font-mono text-xs text-foreground">{result.masked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Banco:</span>
              <span className="font-semibold text-primary">BANKPIX SSA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full">INATIVO</span>
            </div>
          </div>

          <button onClick={handleCopy} className="w-full py-3 rounded-xl bg-muted border border-border text-foreground font-medium mb-4">
            <Copy className="w-4 h-4 inline mr-2" />
            {copied ? 'Copiado!' : 'Copiar'}
          </button>

          {showWarn && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-4">
              <div className="flex gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-500">Conta Limitada</p>
                  <p className="text-sm text-muted-foreground">Ative para usar suas chaves!</p>
                </div>
              </div>
              <button onClick={handleActivate} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold">
                <Play className="w-4 h-4 inline mr-2" />
                Ver video e ativar
              </button>
            </div>
          )}

          <button onClick={onBack} className="w-full py-3 rounded-xl border border-border text-muted-foreground">
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // EMAIL WARNING
  if (screen === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Online />
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Email Bloqueado</h2>
          <p className="text-muted-foreground mb-6">Ative sua conta para usar Email.</p>
          
          <button onClick={handleActivate} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold mb-4">
            <Play className="w-4 h-4 inline mr-2" />
            Ver video e ativar
          </button>
          
          <button onClick={() => { setScreen('form'); setKeyType('cpf') }} className="w-full py-3 rounded-xl border border-border text-muted-foreground">
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // FORM
  return (
    <div className="min-h-screen p-4 pt-20 lg:pt-6 pb-20 bg-background">
      <Online />
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 rounded-lg bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Cadastrar Chave PIX</h1>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Nome da Chave</label>
          <input
            type="text"
            value={keyName}
            onChange={e => setKeyName(e.target.value)}
            placeholder="Escolha qualquer nome para sua chave"
            className="w-full p-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground uppercase"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Tipo</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { t: 'cpf', icon: CreditCard, label: 'CPF' },
              { t: 'celular', icon: Smartphone, label: 'Celular' },
              { t: 'aleatorio', icon: Hash, label: 'Aleatoria' },
              { t: 'email', icon: Mail, label: 'Email', locked: true }
            ].map(({ t, icon: Icon, label, locked }) => (
              <button
                key={t}
                type="button"
                onClick={() => t === 'email' ? setScreen('email') : setKeyType(t as any)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${
                  keyType === t ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                {locked && <Lock className="w-3 h-3 text-yellow-500 absolute top-2 right-2" />}
                <Icon className={`w-6 h-6 ${keyType === t ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${keyType === t ? 'text-primary' : 'text-foreground'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!keyName.trim()}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
        >
          <Key className="w-5 h-5 inline mr-2" />
          Gerar Chave PIX
        </button>
      </div>
    </div>
  )
}
