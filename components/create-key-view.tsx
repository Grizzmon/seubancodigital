'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Key, CheckCircle, Copy, Smartphone, CreditCard, AlertTriangle, Play, Lock, Mail, Hash } from 'lucide-react'
import { type PixKey } from '@/lib/store'

interface CreateKeyViewProps {
  userName: string
  onAddKey: (key: PixKey) => void
  onBack: () => void
}

// Funções Auxiliares (Mantidas)
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

  // Troca as mensagens de loading
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (screen === 'loading') {
      interval = setInterval(() => {
        setMsgIndex(i => (i + 1) % msgs.length)
        setCounter(c => (c > 0 ? c - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [screen])

  const handleGenerate = async () => {
    if (!keyName.trim()) {
      alert('Digite um nome')
      return
    }

    setCounter(5)
    setMsgIndex(0)
    setScreen('loading')

    // ESPERA DE 5 SEGUNDOS (O segredo está em não usar dependências complexas aqui)
    setTimeout(() => {
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
        type: keyType === 'email' ? 'cpf' : keyType, // Fallback caso seja email
        value: val,
        createdAt: new Date()
      }

      onAddKey(newKey)
      setResult({ name: keyName.trim().toUpperCase(), type: keyType, masked })
      setScreen('success')
      
      setTimeout(() => setShowWarn(true), 1500)
    }, 5000)
  }

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

  const Online = () => (
    <div className="fixed top-2 right-2 z-[999] flex items-center gap-1 px-2 py-1 bg-black rounded-full">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="text-[10px] text-green-400 font-bold">v3</span>
    </div>
  )

  // RENDER LOADING
  if (screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background italic">
        <Online />
        <div className="text-center">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Key className="w-8 h-8 text-primary" />
            </div>
          </div>
          <p className="text-lg font-black text-foreground mb-1 uppercase italic tracking-tighter">{msgs[msgIndex]}</p>
          <p className="text-sm text-muted-foreground font-bold">Aguarde {counter}s...</p>
        </div>
      </div>
    )
  }

  // RENDER SUCCESS
  if (screen === 'success' && result) {
    const label = result.type === 'cpf' ? 'CPF' : result.type === 'celular' ? 'CELULAR' : 'ALEATORIA'
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Online />
        <div className="w-full max-w-md animate-in zoom-in duration-300">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Chave Criada!</h2>
          </div>

          <div className="p-6 rounded-[32px] bg-muted border border-border mb-4 space-y-4 shadow-xl text-left">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-xs font-black text-muted-foreground uppercase">Tipo:</span>
              <span className="font-black text-foreground uppercase italic">{label}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-xs font-black text-muted-foreground uppercase">Titular:</span>
              <span className="font-black text-foreground uppercase italic">{result.name}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-xs font-black text-muted-foreground uppercase">Chave:</span>
              <span className="font-mono text-sm text-gray-500 font-bold tracking-tighter">{result.masked}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-xs font-black text-muted-foreground uppercase">Banco:</span>
              <span className="font-black text-primary uppercase italic">BANKPIX SSA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-muted-foreground uppercase">Status:</span>
              <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full animate-pulse">INATIVO</span>
            </div>
          </div>

          <button onClick={handleCopy} className="w-full py-4 rounded-2xl bg-muted border border-border text-foreground font-black uppercase text-sm mb-4 active:scale-95 transition-all">
            <Copy className="w-4 h-4 inline mr-2" />
            {copied ? 'Copiado!' : 'Copiar Comprovante'}
          </button>

          {showWarn && (
            <div className="p-5 rounded-[28px] bg-yellow-500/10 border border-yellow-500/30 mb-4 animate-in slide-in-from-bottom-4">
              <div className="flex gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-black text-yellow-500 uppercase text-sm italic tracking-tighter">Conta Limitada</p>
                  <p className="text-xs text-muted-foreground font-bold leading-tight">Sua chave está pronta, mas precisa de ativação para receber valores.</p>
                </div>
              </div>
              <button onClick={handleActivate} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black uppercase shadow-lg shadow-primary/20 active:scale-95 transition-all">
                <Play className="w-4 h-4 inline mr-2 fill-current" />
                Ver video e ativar
              </button>
            </div>
          )}

          <button onClick={onBack} className="w-full py-3 rounded-xl text-muted-foreground font-bold text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // RENDER EMAIL/BLOCKED
  if (screen === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Online />
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-black text-foreground uppercase italic mb-2 tracking-tighter">Email Bloqueado</h2>
          <p className="text-sm text-muted-foreground font-bold mb-8 uppercase tracking-tighter leading-tight">Nível de conta insuficiente para chaves de email.</p>
          
          <button onClick={handleActivate} className="w-full py-5 rounded-2xl bg-primary text-primary-foreground font-black uppercase shadow-xl mb-4 active:scale-95 transition-all">
            <Play className="w-4 h-4 inline mr-2 fill-current" />
            Ativar Agora
          </button>
          
          <button onClick={() => { setScreen('form'); setKeyType('cpf') }} className="w-full py-3 text-muted-foreground font-bold text-xs uppercase">
            Voltar e escolher outro
          </button>
        </div>
      </div>
    )
  }

  // RENDER FORM (PADRÃO)
  return (
    <div className="min-h-screen p-4 pt-20 lg:pt-6 pb-20 bg-background text-left italic">
      <Online />
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 rounded-2xl bg-muted border border-border">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">Criar Chave PIX</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Conexão Servidor Brasil (SP)</p>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-8">
        <div>
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 ml-1">Identificação da Chave</label>
          <input
            type="text"
            value={keyName}
            onChange={e => setKeyName(e.target.value)}
            placeholder="EX: MINHA CONTA PRINCIPAL"
            className="w-full p-5 rounded-[24px] bg-muted border border-border text-foreground font-black uppercase placeholder:text-gray-800 outline-none focus:border-primary transition-all shadow-inner"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-1">Tipo de Documento</label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { t: 'cpf', icon: CreditCard, label: 'CPF Brasil' },
              { t: 'celular', icon: Smartphone, label: 'Celular' },
              { t: 'aleatorio', icon: Hash, label: 'Aleatória' },
              { t: 'email', icon: Mail, label: 'Email', locked: true }
            ].map(({ t, icon: Icon, label, locked }) => (
              <button
                key={t}
                type="button"
                onClick={() => t === 'email' ? setScreen('email') : setKeyType(t as any)}
                className={`relative flex flex-col items-center gap-3 p-6 rounded-[32px] border-2 transition-all ${
                  keyType === t ? 'border-primary bg-primary/10 scale-105 shadow-lg' : 'border-border grayscale opacity-60'
                }`}
              >
                {locked && <Lock className="w-3 h-3 text-yellow-500 absolute top-3 right-3" />}
                <Icon className={`w-7 h-7 ${keyType === t ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${keyType === t ? 'text-primary' : 'text-foreground'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!keyName.trim()}
          className="w-full py-6 rounded-[28px] bg-primary text-white font-black uppercase text-xl shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <Key className="w-6 h-6" />
          Gerar Chave Agora
        </button>
      </div>
    </div>
  )
}
