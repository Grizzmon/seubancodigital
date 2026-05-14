'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, ArrowLeft, Phone, User, Lock, CheckCircle, Wallet, Calendar, BarChart3, MapPin, Eye, EyeOff } from 'lucide-react'
import { formatPhoneInput, validatePhone, validatePassword } from '@/lib/store'

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

  // Ciclo de mensagens no carregamento final
  useEffect(() => {
    if (finalLoading) {
      const messages = [
        'Verificando seu cadastro...',
        'Preparando seu Pix...',
        'Conectando ao sistema Brasil...',
        'So mais um momento...',
        'Nao feche a tela...'
      ]
      let i = 0
      const interval = setInterval(() => {
        setLoadingMessage(messages[i])
        i = (i + 1) % messages.length
      }, 3500)
      return () => clearInterval(interval)
    }
  }, [finalLoading])

  // Lógica de LOGIN REAL
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
      alert("Conta nao encontrada. Clique no botao abaixo para criar.")
    }
  }

  const nextStep = async () => {
    setIsProcessing(true)
    await new Promise(r => setTimeout(r, 2000))
    setIsProcessing(false)
    setStep(s => s + 1)
  }

  const handleFinalRegister = async () => {
    if (password !== confirmPassword) {
      alert("As senhas nao coincidem!")
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

  if (preLinkLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#001a33] p-6 text-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-bold text-white animate-pulse tracking-widest uppercase">Conectando...</h1>
      </div>
    )
  }

  if (finalLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-20 h-20 border-8 border-gray-100 border-t-primary rounded-full animate-spin mb-8"></div>
        <h1 className="text-2xl font-black text-gray-900 animate-pulse uppercase">{loadingMessage || 'Processando...'}</h1>
      </div>
    )
  }

  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100 text-center">
          <div className="flex flex-col items-center mb-10">
            <div className="p-4 bg-primary/10 rounded-3xl mb-4"><Wallet className="w-12 h-12 text-primary" /></div>
            <h1 className="text-4xl font-black text-gray-900 italic">Bank<span className="text-primary">Pix</span></h1>
          </div>
          
          <form onSubmit={handleActualLogin} className="space-y-4">
            <input 
              type="tel" placeholder="Seu Telefone" 
              className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl text-black font-extrabold text-lg outline-none transition-all"
              value={phone} onChange={e => setPhone(e.target.value)}
            />
            <input 
              type="password" placeholder="Sua Senha" 
              className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl text-black font-extrabold text-lg outline-none transition-all"
              value={password} onChange={e => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl shadow-xl shadow-primary/30 active:scale-95 transition-all">
              ENTRAR NO APP
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-100">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">Primeira vez no BankPix?</p>
            <button 
              onClick={() => { setMode('register'); setStep(1); }}
              className="w-full py-5 bg-white border-[3px] border-primary text-primary rounded-[20px] font-black text-lg hover:bg-primary hover:text-white transition-all duration-300 shadow-xl"
            >
              CRIAR MINHA CONTA AGORA
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Titulos e descricoes para cada etapa
  const stepInfo: { [key: number]: { icon: React.ReactNode; title: string; subtitle: string } } = {
    1: {
      icon: <User className="w-8 h-8 text-primary" />,
      title: "Qual e o seu nome completo?",
      subtitle: "Digite seu nome como esta no documento"
    },
    2: {
      icon: <Calendar className="w-8 h-8 text-primary" />,
      title: "Qual e a sua data de nascimento?",
      subtitle: "Precisamos confirmar sua idade"
    },
    3: {
      icon: <MapPin className="w-8 h-8 text-primary" />,
      title: "Onde voce mora?",
      subtitle: "Selecione sua provincia"
    },
    4: {
      icon: <Phone className="w-8 h-8 text-primary" />,
      title: "Qual e o seu numero de celular?",
      subtitle: "Esse sera seu numero de acesso"
    },
    5: {
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      title: "Qual seu limite diario?",
      subtitle: "Defina o valor que pretende movimentar"
    },
    6: {
      icon: <Lock className="w-8 h-8 text-primary" />,
      title: "Pronto! Seu cadastro esta quase pronto",
      subtitle: "Crie uma senha segura para sua conta"
    }
  }

  const renderStepContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center py-10 space-y-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Validando Dados...</p>
        </div>
      )
    }

    const currentStepInfo = stepInfo[step]

    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-2xl">{currentStepInfo.icon}</div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">{currentStepInfo.title}</h2>
              <p className="text-sm text-gray-500 font-medium">{currentStepInfo.subtitle}</p>
            </div>
            <input autoFocus className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary uppercase" value={name} onChange={e => setName(e.target.value)} placeholder="SEU NOME COMPLETO" />
            <button onClick={nextStep} disabled={!name.trim()} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">CONTINUAR <ArrowRight /></button>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-2xl">{currentStepInfo.icon}</div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">{currentStepInfo.title}</h2>
              <p className="text-sm text-gray-500 font-medium">{currentStepInfo.subtitle}</p>
            </div>
            <input type="date" className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            <button onClick={nextStep} disabled={!birthDate} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">CONTINUAR <ArrowRight /></button>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-2xl">{currentStepInfo.icon}</div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">{currentStepInfo.title}</h2>
              <p className="text-sm text-gray-500 font-medium">{currentStepInfo.subtitle}</p>
            </div>
            <select className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary appearance-none" value={province} onChange={e => setProvince(e.target.value)}>
              <option value="">SELECIONE A PROVINCIA</option>
              <option value="Maputo Cidade">Maputo Cidade</option>
              <option value="Maputo Provincia">Maputo Provincia</option>
              <option value="Gaza">Gaza</option>
              <option value="Inhambane">Inhambane</option>
              <option value="Sofala">Sofala</option>
              <option value="Manica">Manica</option>
              <option value="Tete">Tete</option>
              <option value="Zambezia">Zambezia</option>
              <option value="Nampula">Nampula</option>
              <option value="Cabo Delgado">Cabo Delgado</option>
              <option value="Niassa">Niassa</option>
            </select>
            <button onClick={nextStep} disabled={!province} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">CONTINUAR <ArrowRight /></button>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-2xl">{currentStepInfo.icon}</div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">{currentStepInfo.title}</h2>
              <p className="text-sm text-gray-500 font-medium">{currentStepInfo.subtitle}</p>
            </div>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+258</span>
              <input type="tel" className="w-full p-5 pl-16 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="84XXXXXXX" maxLength={9} />
            </div>
            <p className="text-xs text-gray-400 text-center">Formato: 84, 85, 86 ou 87 + 7 digitos</p>
            <button onClick={nextStep} disabled={phone.length !== 9} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">CONTINUAR <ArrowRight /></button>
          </div>
        )
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-2xl">{currentStepInfo.icon}</div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">{currentStepInfo.title}</h2>
              <p className="text-sm text-gray-500 font-medium">{currentStepInfo.subtitle}</p>
            </div>
            <select className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary appearance-none" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}>
              <option value="">SELECIONE O VALOR</option>
              <option value="1000">R$ 100,00 a R$ 1.000,00</option>
              <option value="5000">R$ 1.000,00 a R$ 5.000,00</option>
              <option value="10000">Mais de R$ 5.000,00</option>
            </select>
            <button onClick={nextStep} disabled={!dailyLimit} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">CONTINUAR <ArrowRight /></button>
          </div>
        )
      case 6:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-2xl">{currentStepInfo.icon}</div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">{currentStepInfo.title}</h2>
              <p className="text-sm text-gray-500 font-medium">{currentStepInfo.subtitle}</p>
            </div>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary pr-14" value={password} onChange={e => setPassword(e.target.value)} placeholder="CRIAR SENHA" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPass ? <EyeOff size={24} /> : <Eye size={24} />}</button>
            </div>
            <input type={showPass ? 'text' : 'password'} className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="CONFIRMAR SENHA" />
            <p className="text-xs text-gray-400 text-center">Minimo 8 caracteres</p>
            <button onClick={handleFinalRegister} disabled={password.length < 8 || password !== confirmPassword} className="w-full py-6 bg-primary text-white rounded-2xl font-black text-xl shadow-xl mt-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">CRIAR MINHA CONTA</button>
          </div>
        )
      case 7:
        return (
          <div className="flex flex-col items-center animate-in zoom-in duration-500 py-6">
            <div className="p-5 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">CONTA CRIADA!</h1>
            <p className="text-lg font-bold text-gray-500 mb-8 text-center">Bem-vindo ao BankPix, {name.split(' ')[0]}!</p>
            <button onClick={() => onLogin(JSON.parse(localStorage.getItem(`bankpix_user_${phone}`)!))} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl shadow-xl shadow-primary/30 active:scale-95 transition-all">ENTRAR NO PAINEL</button>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 border border-gray-100">
        {step < 7 && mode === 'register' && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                  <ArrowLeft size={20}/>
                </button>
              )}
              <div className="bg-primary/10 text-primary text-xs font-black px-4 py-2 rounded-full uppercase tracking-wider">
                Passo {step} de {totalSteps}
              </div>
            </div>
            {/* Progress bar */}
            <div className="flex-1 ml-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 rounded-full" 
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
