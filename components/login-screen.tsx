'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, ArrowLeft, Phone, User, Lock, CheckCircle, Wallet, Calendar, BarChart3, MapPin } from 'lucide-react'
import { formatPhoneInput, validatePhone, validatePassword } from '@/lib/store'

interface UserData {
  name: string
  phone: string
  password: string
  province: string
  birthDate: string
  dailyLimit: string
}

export function LoginScreen({ onLogin }: { onLogin: (userData: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [finalLoading, setFinalLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  // Form States
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [province, setProvince] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [dailyLimit, setDailyLimit] = useState('')

  const totalSteps = 7

  const nextStep = async () => {
    setIsProcessing(true)
    await new Promise(r => setTimeout(r, 2000)) // 2 segundos de processamento entre passos
    setIsProcessing(false)
    setStep(s => s + 1)
  }

  const handleFinalRegister = async () => {
    setFinalLoading(true)
    const messages = [
      'Verificando seu cadastro...',
      'Preparando seu Pix...',
      'Conectando ao sistema Brasil...',
      'Só mais um momento...',
      'Não feche a tela...'
    ]

    for (const msg of messages) {
      setLoadingMessage(msg)
      await new Promise(r => setTimeout(r, 2500))
    }

    const userData = { name, phone, password, province, birthDate, dailyLimit, balance: 0, income: 0, keys: [], transactions: [] }
    localStorage.setItem(`bankpix_user_${phone}`, JSON.stringify(userData))
    setStep(8) // Tela de Sucesso
    setFinalLoading(false)
  }

  // Componente de Input Padronizado (Letras Pretas e Visíveis)
  const StepContainer = ({ title, icon: Icon, children, onNext, showBack = true }: any) => (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">PASSO {step} DE {totalSteps}</span>
        {showBack && <button onClick={() => setStep(step - 1)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20}/></button>}
      </div>
      
      <div className="flex flex-col items-center mb-8">
        <div className="p-4 bg-primary/10 rounded-2xl mb-4 text-primary"><Icon size={32} /></div>
        <h2 className="text-2xl font-bold text-gray-900 text-center">{title}</h2>
      </div>

      <div className="space-y-6">
        {isProcessing ? (
          <div className="flex flex-col items-center py-10 space-y-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-500">Processando informações...</p>
          </div>
        ) : (
          <>
            {children}
            <button 
              onClick={onNext}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
            >
              PRÓXIMO <ArrowRight size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  )

  // --- RENDERS ---

  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <Wallet className="w-12 h-12 text-primary mb-2" />
            <h1 className="text-3xl font-black text-gray-900">Bank<span className="text-primary">Pix</span></h1>
          </div>
          <div className="space-y-4">
            <input 
              type="tel" placeholder="Número de Celular" 
              className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-primary rounded-2xl text-black font-bold outline-none transition-all"
              onChange={(e) => setPhone(e.target.value)}
            />
            <input 
              type="password" placeholder="Sua Senha" 
              className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-primary rounded-2xl text-black font-bold outline-none transition-all"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={() => setMode('register')} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg">ENTRAR</button>
            <button onClick={() => setMode('register')} className="w-full text-center text-sm font-bold text-gray-400">NÃO TEM CONTA? CADASTRE-SE</button>
          </div>
        </div>
      </div>
    )
  }

  // --- MULTI-STEP REGISTER ---

  if (finalLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <div className="w-24 h-24 border-8 border-gray-100 border-t-primary rounded-full animate-spin mb-8"></div>
        <h1 className="text-2xl font-bold text-gray-900 animate-pulse text-center">{loadingMessage}</h1>
      </div>
    )
  }

  if (step === 1) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <StepContainer title="Qual é o seu nome completo?" icon={User} onNext={nextStep} showBack={false}>
        <input 
          autoFocus
          className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary"
          value={name} onChange={e => setName(e.target.value)} placeholder="Nome e Sobrenome"
        />
      </StepContainer>
    </div>
  )

  if (step === 2) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <StepContainer title="Sua data de nascimento?" icon={Calendar} onNext={nextStep}>
        <input 
          type="date"
          className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary"
          value={birthDate} onChange={e => setBirthDate(e.target.value)}
        />
      </StepContainer>
    </div>
  )

  if (step === 3) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <StepContainer title="Onde você mora?" icon={MapPin} onNext={nextStep}>
        <select 
          className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary appearance-none"
          value={province} onChange={e => setProvince(e.target.value)}
        >
          <option value="">Selecione a Província</option>
          <option value="Zambézia">Zambézia</option>
          <option value="Maputo">Maputo</option>
          <option value="Sofala">Sofala</option>
          <option value="Nampula">Nampula</option>
          <option value="Tete">Tete</option>
        </select>
      </StepContainer>
    </div>
  )

  if (step === 4) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <StepContainer title="Seu número de celular?" icon={Phone} onNext={nextStep}>
        <input 
          type="tel"
          className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary"
          value={phone} onChange={e => setPhone(e.target.value)} placeholder="84XXXXXXX"
        />
      </StepContainer>
    </div>
  )

  if (step === 5) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <StepContainer title="Limite diário pretendido?" icon={BarChart3} onNext={nextStep}>
        <select 
          className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary appearance-none"
          value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}
        >
          <option value="">Escolha o valor</option>
          <option value="1000">Até 1.000 MT</option>
          <option value="5000">1.000 a 5.000 MT</option>
          <option value="10000">Acima de 5.000 MT</option>
        </select>
      </StepContainer>
    </div>
  )

  if (step === 6) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <StepContainer title="Crie uma senha forte" icon={Lock} onNext={nextStep}>
        <input 
          type="password"
          className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary"
          value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
        />
      </StepContainer>
    </div>
  )

  if (step === 7) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <StepContainer title="Confirme sua senha" icon={Lock} onNext={handleFinalRegister}>
        <input 
          type="password"
          className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary"
          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
        />
      </StepContainer>
    </div>
  )

  if (step === 8) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 animate-in zoom-in duration-500">
      <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-8">
        <CheckCircle className="w-16 h-16 text-green-500" />
      </div>
      <h1 className="text-4xl font-black text-gray-900 mb-2 text-center">CONTA CRIADA COM SUCESSO!</h1>
      <p className="text-2xl font-bold text-gray-500 mb-10 text-center">A sua conta foi criada, <span className="text-primary">{name.split(' ')[0]}</span>!</p>
      <button 
        onClick={() => onLogin(JSON.parse(localStorage.getItem(`bankpix_user_${phone}`)!))}
        className="w-full max-w-xs py-5 bg-primary text-white rounded-3xl font-black text-xl shadow-2xl hover:scale-105 transition-transform"
      >
        ENTRAR NO APP
      </button>
    </div>
  )

  return null
}
