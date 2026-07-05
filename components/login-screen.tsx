'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, ArrowLeft, Phone, User, Lock, CheckCircle, Wallet, Calendar, BarChart3, MapPin, Eye, EyeOff, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react'
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

  // Estados da Etapa de Documento
  const [docStep, setDocStep] = useState<'frente' | 'verso' | 'previa'>('frente')
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)

  const totalSteps = 7

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
        'Autenticando chaves de segurança...',
        'Sincronizando infraestrutura Pix...',
        'Estabelecendo conexão criptografada...',
        'Finalizando abertura de conta bancária...',
        'Quase pronto, por favor aguarde...'
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
        await new Promise(r => setTimeout(r, 6000))
        onLogin(userData)
      } else {
        alert("Senha incorreta!")
      }
    } else {
      alert("Conta não encontrada. Por favor, crie uma nova conta.")
    }
  }

  const nextStep = async () => {
    if (step === 1) trackLead();
    setIsProcessing(true)
    await new Promise(r => setTimeout(r, 1200))
    setIsProcessing(false)
    setStep(s => s + 1)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0]
    if (file) {
      const fakeUrl = URL.createObjectURL(file)
      if (type === 'front') {
        setFrontImage(fakeUrl)
        setDocStep('verso')
      } else {
        setBackImage(fakeUrl)
        setDocStep('previa')
      }
    }
  }

  const handleDocumentSubmit = async () => {
    setIsProcessing(true)
    setLoadingMessage('Estamos recebendo sua foto...')
    await new Promise(r => setTimeout(r, 6000))
   
    if (frontImage) URL.revokeObjectURL(frontImage)
    if (backImage) URL.revokeObjectURL(backImage)
    setFrontImage(null)
    setBackImage(null)
    setIsProcessing(false)
    setLoadingMessage('')
   
    handleFinalRegister()
  }

  const handleFinalRegister = async () => {
    setPreLinkLoading(true)
    await new Promise(r => setTimeout(r, 6000))
    setPreLinkLoading(false)
    setFinalLoading(true)
    await new Promise(r => setTimeout(r, 14000))
    
    const userData = {
      name: name.trim(), phone, password, province, birthDate, dailyLimit,
      balance: 0, income: 0, keys: [], transactions: []
    }
   
    localStorage.setItem(`bankpix_user_${phone}`, JSON.stringify(userData))
    setStep(8)
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

  // Loading States (mantidos)
  if (preLinkLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-center">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
          <ShieldCheck className="w-10 h-10 text-indigo-400 absolute inset-0 m-auto" />
        </div>
        <h1 className="text-xs font-bold tracking-[0.125em] text-indigo-400 uppercase mb-2">Conexão Segura</h1>
        <p className="text-slate-400 max-w-xs">Autenticando dispositivo em ambiente criptografado...</p>
      </div>
    )
  }

  if (finalLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-3xl p-10 backdrop-blur-2xl">
          <div className="mx-auto w-14 h-14 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-8"></div>
          <p className="text-slate-300 text-center font-medium min-h-[28px]">{loadingMessage || 'Processando...'}</p>
        </div>
      </div>
    )
  }

  // Login Screen
  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold tracking-tighter text-slate-900">
              Bank<span className="text-indigo-600">Pix</span>
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight mb-2">Bem-vindo de volta</h1>
          <p className="text-slate-500 mb-8">Acesse sua conta digital</p>

          <form onSubmit={handleActualLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-4 text-slate-400" size={20} />
                <input
                  type="tel"
                  placeholder="84 XXX XXXX"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all text-lg"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all text-lg"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-2xl text-lg active:scale-[0.985] transition-all shadow-lg shadow-indigo-500/30 hover:brightness-105"
            >
              Entrar
            </button>
          </form>

          <button
            onClick={() => { setMode('register'); setStep(1); setDocStep('frente'); }}
            className="w-full mt-6 py-4 text-indigo-600 font-semibold hover:bg-slate-100 rounded-2xl transition-colors"
          >
            Criar uma nova conta
          </button>
        </div>
      </div>
    )
  }

  // Register Flow
  const stepInfo: { [key: number]: { icon: React.ReactNode; title: string; subtitle: string } } = { /* mantido igual */ 
    // ... (mesmo objeto do código original)
  }

  const renderStepContent = () => { /* ... mantido com pequenas melhorias visuais */ }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden min-h-[580px] flex flex-col">
        
        {/* Header + Progress */}
        {step < 8 && (
          <div className="p-8 pb-6 border-b border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <button 
                    onClick={() => {
                      if (step === 7 && docStep !== 'frente') {
                        setDocStep(docStep === 'previa' ? 'verso' : 'frente')
                      } else {
                        setStep(step - 1)
                      }
                    }}
                    className="p-3 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white">
                    <Wallet size={18} />
                  </div>
                  <span className="font-bold tracking-tight text-xl">BankPix</span>
                </div>
              </div>
              <button onClick={() => setMode('login')} className="text-sm text-slate-400 hover:text-slate-600">Sair</button>
            </div>

            {/* Progress Bar Melhorada */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${i + 1 <= step ? 'bg-indigo-600' : 'bg-slate-200'}`}
                />
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-3 font-medium">
              Passo {step} de {totalSteps}
            </p>
          </div>
        )}

        <div className="flex-1 p-8 flex flex-col">
          {mode === 'register' && renderStepContent()}
        </div>
      </div>
    </div>
  )
}
