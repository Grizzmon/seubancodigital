'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, ArrowLeft, Phone, User, Lock, CheckCircle, Wallet, Calendar, BarChart3, MapPin, Eye, EyeOff } from 'lucide-react'
import { formatPhoneInput, validatePhone, validatePassword } from '@/lib/store'
import { showInstallPrompt } from './install-prompt'

export function LoginScreen({ onLogin }: { onLogin: (userData: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preLinkLoading, setPreLinkLoading] = useState(false)
  const [finalLoading, setFinalLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  // Estados do Formulário
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [province, setProvince] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [dailyLimit, setDailyLimit] = useState('')
  const [showPass, setShowPass] = useState(false)

  const totalSteps = 6
  // Cálculo dinâmico dos passos restantes
  const stepsRemaining = totalSteps - step

  const trackLead = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead', {
        content_name: 'Cadastro BankPix',
        status: 'Iniciado'
      });
    }
  }

  useEffect(() => {
    if (finalLoading) {
      const messages = [
        'Verificando seu cadastro...',
        'Preparando seu Pix...',
        'Conectando ao sistema...',
        'Só mais um momento...',
        'Não feche a tela...'
      ]
      let i = 0
      const interval = setInterval(() => {
        setLoadingMessage(messages[i])
        i = (i + 1) % messages.length
      }, 3500)
      return () => clearInterval(interval)
    }
  }, [finalLoading])

  const handleActualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const savedData = localStorage.getItem(`bankpix_user_${phone}`)

    if (savedData) {
      const userData = JSON.parse(savedData)
      if (userData.password === password) {
        setPreLinkLoading(true) 
        await new Promise(r => setTimeout(r, 7000))
        onLogin(userData)
      } else {
        alert("Senha incorreta!")
      }
    } else {
      alert("Conta não encontrada. Por favor, crie uma nova conta.")
    }
  }

  const nextStep = async () => {
    if (step === 1) {
      trackLead();
    }
    setIsProcessing(true)
    await new Promise(r => setTimeout(r, 1500))
    setIsProcessing(false)
    setStep(s => s + 1)
  }

  const handleFinalRegister = async () => {
    if (password !== confirmPassword) {
      alert("As senhas não coincidem!")
      return
    }

    setPreLinkLoading(true)
    await new Promise(r => setTimeout(r, 7000))
    setPreLinkLoading(false)

    setFinalLoading(true)
    await new Promise(r => setTimeout(r, 17500)) 

    const userData = { 
      name: name.trim(), 
      phone, 
      password, 
      province, 
      birthDate, 
      dailyLimit, 
      balance: 0, 
      income: 0, 
      keys: [], 
      transactions: [] 
    }
    
    localStorage.setItem(`bankpix_user_${phone}`, JSON.stringify(userData))
    setStep(7)
    setFinalLoading(false)
  }

  const handleCompleteRegistration = () => {
    const data = localStorage.getItem(`bankpix_user_${phone}`);
    if (data) {
      const userData = JSON.parse(data);
      showInstallPrompt();
      onLogin(userData);
    }
  }

  if (preLinkLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        </div>
        <h1 className="text-xl font-semibold text-slate-100 tracking-wider animate-pulse uppercase">Conectando ao servidor seguro...</h1>
      </div>
    )
  }

  if (finalLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        </div>
        <h1 className="text-xl font-bold text-slate-800 animate-pulse tracking-wide">{loadingMessage || 'Processando requisição...'}</h1>
      </div>
    )
  }

  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-100/70 p-8 border border-slate-100">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-primary/10 rounded-xl mb-3">
              <Wallet className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Bank<span className="text-primary font-light">Pix</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Acesse sua conta digital</p>
          </div>
          
          <form onSubmit={handleActualLogin} className="space-y-4">
            <div>
              <input 
                type="tel" placeholder="Seu número de telefone" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-base outline-none focus:border-primary focus:bg-white transition-all"
                value={phone} onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div>
              <input 
                type="password" placeholder="Sua senha de acesso" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-base outline-none focus:border-primary focus:bg-white transition-all"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full py-4 bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold text-base transition-all active:scale-[0.99] shadow-lg shadow-primary/20">
              Acessar Painel
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Novo por aqui?</p>
            <button 
              onClick={() => { setMode('register'); setStep(1); }}
              className="w-full py-3.5 bg-white border border-primary/30 text-primary hover:bg-primary/5 rounded-xl font-semibold text-base transition-all"
            >
              Abra sua Conta Grátis
            </button>
          </div>
        </div>
      </div>
    )
  }

  const stepInfo: { [key: number]: { icon: React.ReactNode; title: string; subtitle: string } } = {
    1: {
      icon: <User className="w-6 h-6 text-primary" />,
      title: "Qual seu nome completo?",
      subtitle: "Insira conforme consta em seu documento oficial"
    },
    2: {
      icon: <Calendar className="w-6 h-6 text-primary" />,
      title: "Sua data de nascimento?",
      subtitle: "Necessário para validação de maioridade"
    },
    3: {
      icon: <MapPin className="w-6 h-6 text-primary" />,
      title: "Qual a sua localização?",
      subtitle: "Selecione a sua província atual"
    },
    4: {
      icon: <Phone className="w-6 h-6 text-primary" />,
      title: "Número de celular?",
      subtitle: "Este número será a sua chave de login de acesso"
    },
    5: {
      icon: <BarChart3 className="w-6 h-6 text-primary" />,
      title: "Defina seu limite diário",
      subtitle: "Escolha a média estimada de movimentações"
    },
    6: {
      icon: <Lock className="w-6 h-6 text-primary" />,
      title: "Segurança da Conta",
      subtitle: "Crie uma senha forte de acesso para proteção dos seus dados"
    }
  }

  const renderStepContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center py-12 space-y-3">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Criptografando dados...</p>
        </div>
      )
    }

    const currentStepInfo = stepInfo[step]

    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-primary/10 rounded-xl">{currentStepInfo.icon}</div>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{currentStepInfo.subtitle}</p>
            </div>
            <input autoFocus className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-lg outline-none focus:border-primary focus:bg-white uppercase transition-all" value={name} onChange={e => setName(e.target.value)} placeholder="NOME COMPLETO" />
            <button onClick={nextStep} disabled={!name.trim()} className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Continuar <ArrowRight size={18} /></button>
          </div>
        )
      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-primary/10 rounded-xl">{currentStepInfo.icon}</div>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{currentStepInfo.subtitle}</p>
            </div>
            <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-lg outline-none focus:border-primary focus:bg-white transition-all" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            <button onClick={nextStep} disabled={!birthDate} className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Continuar <ArrowRight size={18} /></button>
          </div>
        )
      case 3:
        return (
          <div className="space-y-5">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-primary/10 rounded-xl">{currentStepInfo.icon}</div>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{currentStepInfo.subtitle}</p>
            </div>
            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-base outline-none focus:border-primary focus:bg-white transition-all appearance-none" value={province} onChange={e => setProvince(e.target.value)}>
              <option value="">SELECIONE A PROVÍNCIA</option>
              <option value="Maputo Cidade">Maputo Cidade</option>
              <option value="Maputo Provincia">Maputo Província</option>
              <option value="Gaza">Gaza</option>
              <option value="Inhambane">Inhambane</option>
              <option value="Sofala">Sofala</option>
              <option value="Manica">Manica</option>
              <option value="Tete">Tete</option>
              <option value="Zambezia">Zambézia</option>
              <option value="Nampula">Nampula</option>
              <option value="Cabo Delgado">Cabo Delgado</option>
              <option value="Niassa">Niassa</option>
            </select>
            <button onClick={nextStep} disabled={!province} className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Continuar <ArrowRight size={18} /></button>
          </div>
        )
      case 4:
        return (
          <div className="space-y-5">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-primary/10 rounded-xl">{currentStepInfo.icon}</div>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{currentStepInfo.subtitle}</p>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">+258</span>
              <input type="tel" className="w-full p-4 pl-16 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-lg outline-none focus:border-primary focus:bg-white transition-all" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="84XXXXXXX" maxLength={9} />
            </div>
            <p className="text-[11px] text-slate-400 text-center">Prefixos válidos: 84, 85, 86 ou 87</p>
            <button onClick={nextStep} disabled={phone.length !== 9} className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Continuar <ArrowRight size={18} /></button>
          </div>
        )
      case 5:
        return (
          <div className="space-y-5">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-primary/10 rounded-xl">{currentStepInfo.icon}</div>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{currentStepInfo.subtitle}</p>
            </div>
            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-base outline-none focus:border-primary focus:bg-white transition-all appearance-none" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}>
              <option value="">SELECIONE O VALOR</option>
              <option value="1000">Até R$ 1.000,00</option>
              <option value="5000">De R$ 1.000,00 a R$ 5.000,00</option>
              <option value="10000">Acima de R$ 5.000,00</option>
            </select>
            <button onClick={nextStep} disabled={!dailyLimit} className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Continuar <ArrowRight size={18} /></button>
          </div>
        )
      case 6:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-primary/10 rounded-xl">{currentStepInfo.icon}</div>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{currentStepInfo.subtitle}</p>
            </div>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-lg outline-none focus:border-primary focus:bg-white pr-12 transition-all" value={password} onChange={e => setPassword(e.target.value)} placeholder="Crie sua senha" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPass ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
            <input type={showPass ? 'text' : 'password'} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-lg outline-none focus:border-primary focus:bg-white transition-all" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirme sua senha" />
            <p className="text-[11px] text-slate-400 text-center">A senha deve conter no mínimo 8 caracteres</p>
            <button onClick={handleFinalRegister} disabled={password.length < 8 || password !== confirmPassword} className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-base shadow-lg shadow-primary/15 mt-2 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed">Finalizar Cadastro</button>
          </div>
        )
      case 7:
        return (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 py-4">
            <div className="p-4 bg-emerald-50 rounded-full mb-4 border border-emerald-100">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Conta Ativada!</h1>
            <p className="text-sm font-medium text-slate-400 mb-6 text-center">Seja bem-vindo ao ecossistema BankPix, {name.split(' ')[0]}!</p>
            <button onClick={handleCompleteRegistration} className="w-full py-4 bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold text-base shadow-lg shadow-primary/20 transition-all active:scale-[0.99]">Acessar minha conta</button>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-100/70 p-6 border border-slate-100">
        {step < 7 && mode === 'register' && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button onClick={() => setStep(step - 1)} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                    <ArrowLeft size={16}/>
                  </button>
                )}
                <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/5 px-2.5 py-1 rounded-md">
                  Etapa {step}/{totalSteps}
                </span>
              </div>
              
              {/* INDICADOR DE PASSOS RESTANTES */}
              <span className="text-xs font-medium text-slate-400">
                {stepsRemaining === 1 ? 'Último passo restante!' : `Faltam ${stepsRemaining} passos`}
              </span>
            </div>
            
            {/* Barra de Progresso mais fina e elegante */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full" 
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}
        {mode === 'register' ? renderStepContent() : null}
      </div>
    </div>
  )
}
