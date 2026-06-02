'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Key, CheckCircle, Copy, Smartphone, CreditCard, AlertTriangle, Lock, Mail, Hash, Eye, X, Clock, PlayCircle } from 'lucide-react'
import { type PixKey } from '@/lib/store'

interface CreateKeyViewProps {
  userName: string
  onAddKey: (key: PixKey) => void
  onBack: () => void
  vslVersion?: string // Recebe a versão vinda da página principal
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

export function CreateKeyView({ userName, onAddKey, onBack, vslVersion = "9" }: CreateKeyViewProps) {
  const [keyName, setKeyName] = useState('')
  const [keyType, setKeyType] = useState<'cpf' | 'celular' | 'aleatorio' | 'email'>('cpf')
  const [screen, setScreen] = useState<'form' | 'loading' | 'success' | 'email'>('form')
  const [msgIndex, setMsgIndex] = useState(0)
  const [result, setResult] = useState<{ name: string; type: string; raw: string; masked: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showRecargaModal, setShowRecargaModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)

  // Inicializa o Pixel do Meta Ads se ele ainda não estiver na página
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

  // Efeito do Cronômetro Regressivo
  useEffect(() => {
    if (screen !== 'success') return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [screen])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const msgs = ['Gerando chave...', 'Conectando ao servidor...', 'Validando com Banco Central...', 'Registrando chave...', 'Finalizando...']

  useEffect(() => {
    if (screen !== 'loading') return
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev < msgs.length - 1 ? prev + 1 : prev))
    }, 1000)
    return () => clearInterval(interval)
  }, [screen])

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

  // FUNÇÃO DE REDIRECIONAMENTO COM DISPARO DO EVENTO DO FACEBOOK (META ADS)
  const handleRecargaRedirect = (origemBotao: string) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      ;(window as any).fbq('track', 'Lead', {
        content_name: 'Ativacao Conta BankPix',
        button_clicked: origemBotao,
        status: 'Pendente Ativacao'
      });
    }
    
    // Roteamento inteligente baseado na versão capturada
    const linkDestino = vslVersion === "13" 
      ? 'https://loteriasegredo.com/bankpixnew/' 
      : 'https://loteriasegredo.com/bankpixativarhoje/';
    
    window.location.href = linkDestino;
  }

  // LOADING SCREEN
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

  // SUCCESS SCREEN
  if (screen === 'success' && result) {
    const label = result.type === 'cpf' ? 'CPF' : result.type === 'celular' ? 'CELULAR' : 'ALEATÓRIA'
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
        <div className="w-full max-w-md">
          
          {/* CRONÔMETRO DE URGÊNCIA TOPO */}
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-red-500">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Atenção! Prazo de Ativação:</span>
            </div>
            <span className="font-mono font-bold text-red-500 bg-red-500/20 px-2.5 py-0.5 rounded-md text-sm">
              {timeLeft > 0 ? formatTime(timeLeft) : "EXPIRADO"}
            </span>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Chave Criada com Sucesso!</h2>
            <p className="text-sm text-muted-foreground">Sua chave PIX foi registrada no system</p>
          </div>

          <div className="p-5 rounded-2xl bg-muted/50 border border-border mb-4 space-y-4">
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
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mb-3 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copiado com Sucesso!' : 'Copiar Dados da Chave'}
          </button>

          <button 
            onClick={onBack} 
            className="w-full py-3 rounded-xl border border-border text-muted-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </button>

          {/* SEÇÃO INFERIOR COM O TRAQUEAMENTO DO PIXEL */}
          <div className="p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 space-y-4 text-center">
            <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-500">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-sm uppercase tracking-wide">Ação Obrigatória Requerida</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tá quase para finalizar a ativação da sua conta! É estritamente necessário realizar a primeira recarga para desbloquear o recebimento de PIX. Saiba como ativar os recursos e baixar o aplicativo oficial clicando abaixo.
            </p>
            <button
              onClick={() => handleRecargaRedirect('botao_inferior_ver_como_ativar')}
              className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-yellow-500/10"
            >
              <PlayCircle className="w-4 h-4" />
              Ver Como Ativar
            </button>
          </div>

        </div>

        {/* MODAL DO OLHO COM O TRAQUEAMENTO DO PIXEL */}
        {showRecargaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
              
              <button 
                onClick={() => setShowRecargaModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <h3 className="text-xl font-bold text-foreground mb-1">
                {timeLeft > 0 ? "Recarregue para ver sua chave!" : "Tempo Limite Esgotado!"}
              </h3>
              
              {timeLeft > 0 ? (
                <p className="text-xs font-mono font-bold text-red-500 mb-4 bg-red-500/10 py-1 inline-block px-3 rounded-full">
                  Sua conta será CANCELADA em: {formatTime(timeLeft)}
                </p>
              ) : (
                <p className="text-xs font-mono font-bold text-red-600 mb-4 bg-red-600/20 py-1 inline-block px-3 rounded-full">
                  CONTA EM PROCESSO DE EXCLUSÃO
                </p>
              )}
              
              {/* LINHA CORRIGIDA SEM ELEMENTOS QUE QUEBRAM O COMPILADOR */}
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Você ainda não ativou o cadastro. Sem realizar a recarga de ativação agora, <strong className="font-semibold text-foreground">não será possível utilizar a conta</strong> e seus dados gerados serão permanentemente desvinculados por segurança. Veja o passo a passo em vídeo imediatamente!
              </p>

              <button 
                onClick={() => handleRecargaRedirect('modal_olho_recarregar_e_ativar')}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                Recarregar e Ativar Agora
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

  // FORM SCREEN
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
