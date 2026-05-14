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
      alert("Conta não encontrada. Clique no botão de destaque abaixo para criar.")
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

  const renderStepContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center py-10 space-y-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Validando Dados...</p>
        </div>
      )
    }

    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <input autoFocus className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-2xl outline-none focus:border-primary uppercase" value={name} onChange={e => setName(e.target.value)} placeholder="NOME COMPLETO" />
            <button onClick={nextStep} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2">SEGUINTE <ArrowRight /></button>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <input type="date" className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            <button onClick={nextStep} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2">SEGUINTE <ArrowRight /></button>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <select className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary appearance-none" value={province} onChange={e => setProvince(e.target.value)}>
              <option value="">PROVÍNCIA</option>
              <option value="Zambézia">Zambézia</option>
              <option value="Maputo">Maputo</option>
              <option value="Sofala">Sofala</option>
              <option value="Nampula">Nampula</option>
              <option value="Tete">Tete</option>
            </select>
            <button onClick={nextStep} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2">SEGUINTE <ArrowRight /></button>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <input type="tel" className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-2xl outline-none focus:border-primary" value={phone} onChange={e => setPhone(e.target.value)} placeholder="84XXXXXXX" />
            <button onClick={nextStep} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2">SEGUINTE <ArrowRight /></button>
          </div>
        )
      case 5:
        return (
          <div className="space-y-6">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 block mb-2 text-center">Qual é seu limite de movimento diário?</label>
            <select className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary appearance-none" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}>
              <option value="">SELECIONE O VALOR</option>
              <option value="1000">R$ 100,00 A R$ 1.000,00</option>
              <option value="5000">R$ 1.000,00 A R$ 5.000,00</option>
              <option value="10000">MAIS DE R$ 5.000,00</option>
            </select>
            <button onClick={nextStep} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 uppercase tracking-tight">Próximo Passo <ArrowRight /></button>
          </div>
        )
      case 6:
        return (
          <div className="space-y-4">
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-2xl outline-none focus:border-primary" value={password} onChange={e => setPassword(e.target.value)} placeholder="CRIAR SENHA" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-6 text-gray-400">{showPass ? <EyeOff /> : <Eye />}</button>
            </div>
            <input type={showPass ? 'text' : 'password'} className="w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-2xl outline-none focus:border-primary" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="CONFIRMAR SENHA" />
            <button onClick={handleFinalRegister} className="w-full py-6 bg-primary text-white rounded-2xl font-black text-2xl shadow-xl mt-4 active:scale-95 transition-all">ABRIR CONTA AGORA</button>
          </div>
        )
      case 7:
        return (
          <div className="flex flex-col items-center animate-in zoom-in duration-500">
            <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
            <h1 className="text-3xl font-black text-gray-900 mb-2">CONTA ATIVA!</h1>
            <p className="text-xl font-bold text-gray-500 mb-8 text-center uppercase tracking-tight">Bem-vindo, {name.split(' ')[0]}!</p>
            <button onClick={() => onLogin(JSON.parse(localStorage.getItem(`bankpix_user_${phone}`)!))} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl">ENTRAR NO PAINEL</button>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100">
        {step < 7 && mode === 'register' && (
          <div className="flex justify-between items-center mb-8">
            <div className="bg-primary/10 text-primary text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">PASSO {step} DE {totalSteps}</div>
            {step > 1 && <button onClick={() => setStep(step - 1)} className="text-gray-300 hover:text-gray-900 transition-colors"><ArrowLeft size={24}/></button>}
          </div>
        )}
        {mode === 'register' ? renderStepContent() : null}
      </div>
    </div>
  )
}
