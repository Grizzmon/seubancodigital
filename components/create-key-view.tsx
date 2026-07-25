'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Key, CheckCircle, Copy, Smartphone, CreditCard, AlertCircle, Lock, Mail, Hash, Eye, X, PlayCircle, ShieldCheck } from 'lucide-react'
import { type PixKey } from '@/lib/store'

interface CreateKeyViewProps {
  userName: string
  onAddKey: (key: PixKey) => void
  onBack: () => void
  vslVersion?: string
}

function generateCPF(): string {
  const n1 = Math.floor(Math.random() * 900) + 100
  const n2 = Math.floor(Math.random() * 90) + 10
  return `${n1}.${n2}`
}

function generatePhone(): string {
  const ddd = ['84', '85', '82', '86', '87'][Math.floor(Math.random() * 5)]
  const end = Math.floor(Math.random() * 90) + 10
  return `+258 ${ddd}`
}

function generateRandom(): string {
  return `a8f9`
}

// Formatação padronizada com *** para todos os tipos
function maskCPF(): string {
  const n1 = Math.floor(Math.random() * 800) + 100
  const end = Math.floor(Math.random() * 80) + 10
  return `${n1}.***.***-${end}`
}

function maskPhone(): string {
  const ddd = ['84', '85', '82', '86', '87'][Math.floor(Math.random() * 5)]
  const end = Math.floor(Math.random() * 80) + 10
  return `+258 ${ddd} *** ***${end}`
}

function maskRandom(): string {
  return `a8f9-***-***-2b4c`
}

export function CreateKeyView({ userName, onAddKey, onBack, vslVersion = "9" }: CreateKeyViewProps) {
  const [keyName, setKeyName] = useState('')
  const [keyType, setKeyType] = useState<'cpf' | 'celular' | 'aleatorio' | 'email'>('cpf')
  const [screen, setScreen] = useState<'form' | 'loading' | 'success' | 'email'>('form')
  const [msgIndex, setMsgIndex] = useState(0)
  const [result, setResult] = useState<{ name: string; type: string; raw: string; masked: string } | null>(null)
  const [showRecargaModal, setShowRecargaModal] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).fbq) {
      /* eslint-disable */
      ;(function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      )(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      ;(window as any).fbq('init', '829061486173119');
      ;(window as any).fbq('track', 'PageView');
    }
  }, [])

  const msgs = [
    'Iniciando protocolo seguro...',
    'Gerando chave PIX...',
    'Conectando aos servidores...',
    'Validando autenticidade...',
    'Registrando chave...',
    'Sincronizando dados...',
    'Finalizando ativação...'
  ]

  useEffect(() => {
    if (screen !== 'loading') return
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev < msgs.length - 1 ? prev + 1 : prev))
    }, 1850)
    return () => clearInterval(interval)
  }, [screen, msgs.length])

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
        masked = maskCPF()
      } else if (keyType === 'celular') {
        val = generatePhone()
        masked = maskPhone()
      } else {
        val = generateRandom()
        masked = maskRandom()
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
    }, 13000)
  }

  const handleRecargaRedirect = (origemBotao: string) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      ;(window as any).fbq('track', 'Lead', {
        content_name: 'Ativacao Conta BankPix',
        button_clicked: origemBotao,
        status: 'Pendente Ativacao'
      });
    }
    
    const linkDestino = 'https://loteriasegredo.com/activebankpixaccount/'
    window.location.href = linkDestino;
  }

  // LOADING SCREEN (PONTOS AZUIS + DESIGN LEVE)
  if (screen === 'loading') {
    const progressPercent = Math.min(100, Math.round(((msgIndex + 1) / msgs.length) * 100))

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-sm p-8 rounded-3xl bg-white border border-blue-100 shadow-xl shadow-blue-500/5 text-center relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
            <div 
              className="h-full bg-blue-600 transition-all duration-700 ease-out" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Key className="w-9 h-9" />
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="h-12 flex items-center justify-center mb-2">
            <p className="text-base font-semibold text-slate-800 leading-snug">
              {msgs[msgIndex]}
            </p>
          </div>

          {/* Pontos Azuis Animados */}
          <div className="flex items-center justify-center gap-2.5 my-6">
            <span className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" />
          </div>

          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Não feche o aplicativo
          </p>

        </div>
      </div>
    )
  }

  // SUCCESS SCREEN (ESTILO FINTECH AZUL E BRANCO)
  if (screen === 'success' && result) {
    const labelType = result.type === 'cpf' ? 'CPF' : result.type === 'celular' ? 'Celular' : 'Aleatória'

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative">
        <div className="w-full max-w-md">
          
          {/* Topo do Sucesso */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Chave Registrada!</h2>
            <p className="text-sm text-slate-500">Sua chave PIX está pronta para ser ativada</p>
          </div>

          {/* CARD AGRUPADO E UNIFICADO */}
          <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-xl shadow-blue-500/5 mb-6 space-y-4">
            
            {/* Titular e Instituição Juntos */}
            <div className="pb-4 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-0.5">Titular</span>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{result.name}</h3>
              
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs font-medium text-slate-400">Instituição:</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Bankpix SSA
                </span>
              </div>
            </div>

            {/* Linha da Chave (Com *** e Blur Leve) */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                  Chave ({labelType})
                </span>
                
                {/* Exibição combinada de *** e blur leve [1.5px] */}
                <div className="flex items-center gap-1 font-mono text-base font-semibold text-slate-800">
                  <span className="select-none blur-[1.5px] tracking-wider opacity-90">
                    {result.masked}
                  </span>
                </div>
              </div>

              {/* Botão do Olho na Direita */}
              <button 
                type="button" 
                onClick={() => setShowRecargaModal(true)} 
                className="p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all active:scale-95 border border-blue-100 shadow-sm"
                aria-label="Visualizar chave"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>

          </div>

          {/* Botão de Copiar / Ação Principal */}
          <button 
            onClick={() => setShowRecargaModal(true)} 
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold mb-3 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
          >
            <Copy className="w-4 h-4" />
            Copiar Dados da Chave
          </button>

          <button 
            onClick={onBack} 
            className="w-full py-3 rounded-2xl border border-slate-200 text-slate-500 font-medium flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </button>

          {/* Caixa do Aviso de Ativação */}
          <div className="p-5 rounded-3xl bg-blue-50/60 border border-blue-100 text-center space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Para ver sua chave, utilizar todos os recursos, receber e fazer saque no Mpesa e Emola veja o vídeo completo e ative sua conta.
            </p>
            <button
              onClick={() => handleRecargaRedirect('botao_inferior_ver_como_ativar')}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/10 active:scale-[0.98]"
            >
              <PlayCircle className="w-4 h-4" />
              Ver Vídeo e Ativar Conta
            </button>
          </div>

        </div>

        {/* MODAL DO OLHO */}
        {showRecargaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-blue-100 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
              
              <button 
                onClick={() => setShowRecargaModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Ativação Necessária
              </h3>
              
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Para ver sua chave, utilizar todos os recursos, receber e fazer saque no Mpesa e Emola veja o vídeo completo e ative sua conta.
              </p>

              <button 
                onClick={() => handleRecargaRedirect('modal_olho_recarregar_e_ativar')}
                className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all active:scale-[0.98]"
              >
                <PlayCircle className="w-5 h-5" />
                Assistir Vídeo e Ativar
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // EMAIL WARNING SCREEN
  if (screen === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md text-center bg-white p-8 rounded-3xl border border-blue-100 shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Chave Email Indisponível</h2>
          <p className="text-slate-500 text-sm mb-6">Para cadastrar chave por Email, você precisa ativar sua conta primeiro.</p>
          
          <button 
            onClick={() => { setScreen('form'); setKeyType('cpf') }} 
            className="w-full py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar e escolher outro tipo
          </button>
        </div>
      </div>
    )
  }

  // FORM SCREEN
  return (
    <div className="min-h-screen p-4 pt-12 pb-20 bg-slate-50">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={onBack} 
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Cadastrar Chave PIX</h1>
            <p className="text-xs text-slate-500">Crie uma nova chave para receber pagamentos</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Nome da Chave</label>
              <input
                type="text"
                value={keyName}
                onChange={e => setKeyName(e.target.value)}
                placeholder="Ex: MEU PIX PRINCIPAL"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all uppercase text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-3">Tipo de Chave</label>
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
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      keyType === t ? 'border-blue-600 bg-blue-50/50 text-blue-600' : 'border-slate-100 text-slate-500 hover:border-blue-200'
                    }`}
                  >
                    {locked && <Lock className="w-3.5 h-3.5 text-amber-500 absolute top-2 right-2" />}
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!keyName.trim()}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            <Key className="w-5 h-5" />
            Gerar Chave PIX
          </button>
        </div>
      </div>
    </div>
  )
}
