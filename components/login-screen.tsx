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

  // --- 1. DESIGN DE SERVIDOR SEGURO (PRE-LINK) ---
  if (preLinkLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center antialiased select-none">
        <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-indigo-500/10 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
          <ShieldCheck className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-xs font-bold tracking-[0.3em] text-indigo-400 uppercase mb-2 animate-pulse">
          Conexão Criptografada SSL
        </h1>
        <p className="text-sm text-slate-400 max-w-xs font-light leading-relaxed">
          Autenticando as chaves do seu dispositivo em ambiente de alta segurança corporativa.
        </p>
      </div>
    )
  }

  // --- 2. DESIGN DE PROCESSAMENTO GERAL (FINAL LOADING) ---
  if (finalLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center antialiased">
        <div className="w-full max-w-sm bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl">
          <div className="relative w-12 h-12 mx-auto mb-8 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-indigo-500/10 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Análise de Segurança</h2>
          <p className="text-base font-medium text-slate-200 h-12 flex items-center justify-center px-2 transition-all duration-300">
            {loadingMessage || 'Processando requisição...'}
          </p>
          <div className="mt-6 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-3/4 animate-[pulse_1.5s_infinite] rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  // --- 3. DESIGN DE LOGIN PREMIUM (ESTILO NUBANK CLEAN) ---
  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-6 antialiased">
        <div className="w-full max-w-md bg-white rounded-[32px] p-10 border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] flex flex-col justify-between relative min-h-[580px]">
          
          <div>
            <div className="flex items-center gap-2.5 mb-12">
              <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Bank<span className="text-indigo-600 font-medium">Pix</span>
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Olá! Digite suas credenciais</h1>
            <p className="text-sm text-slate-400 font-light mb-8">Insira seus dados para acessar sua conta digital.</p>
            
            <form onSubmit={handleActualLogin} className="space-y-5">
              <div className="relative flex items-center">
                <User className="absolute left-4 w-4 h-4 text-slate-400" />
                <input 
                  type="tel" placeholder="Telefone ou chave digital" 
                  className="w-full p-4 pl-12 bg-slate-50 border border-transparent rounded-2xl text-slate-900 font-medium text-sm outline-none focus:border-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                  value={phone} onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-4 h-4 text-slate-400" />
                <input 
                  type={showPass ? 'text' : 'password'} placeholder="Senha de acesso" 
                  className="w-full p-4 pl-12 pr-12 bg-slate-50 border border-transparent rounded-2xl text-slate-900 font-medium text-sm outline-none focus:border-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm tracking-wide transition-all shadow-sm active:scale-[0.98] mt-4">
                Entrar na conta
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button 
              onClick={() => { setMode('register'); setStep(1); setDocStep('frente'); }}
              className="w-full py-4 text-indigo-600 hover:bg-slate-50 rounded-2xl font-semibold text-sm transition-all"
            >
              Quero criar uma conta gratuita
            </button>
          </div>

        </div>
      </div>
    )
  }

  const stepInfo: { [key: number]: { icon: React.ReactNode; title: string; subtitle: string } } = {
    1: { icon: <User className="w-5 h-5 text-indigo-600" />, title: "Qual é o seu nome completo?", subtitle: "Preencha de forma idêntica ao seu documento oficial." },
    2: { icon: <Calendar className="w-5 h-5 text-indigo-600" />, title: "Qual sua data de nascimento?", subtitle: "Necessário para validação de maioridade legal." },
    3: { icon: <MapPin className="w-5 h-5 text-indigo-600" />, title: "Onde você reside atualmente?", subtitle: "Selecione a província do seu domicílio fiscal." },
    4: { icon: <Phone className="w-5 h-5 text-indigo-600" />, title: "Qual o número do seu telefone?", subtitle: "Este terminal principal será utilizado para o seu login seguro." },
    5: { icon: <BarChart3 className="w-5 h-5 text-indigo-600" />, title: "Qual o seu volume operacional?", subtitle: "Defina a estimativa padrão de limites diários para sua movimentação." },
    6: { icon: <Lock className="w-5 h-5 text-indigo-600" />, title: "Crie uma senha de segurança", subtitle: "Escolha uma combinação forte para assinar suas transações." },
    7: { icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />, title: "Verificação de identidade", subtitle: "Capture uma imagem nítida do documento para validação biométrica." }
  }

  const renderStepContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-indigo-600/10 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-xs font-medium text-slate-400 tracking-wide animate-pulse">Guardando dados com segurança...</p>
        </div>
      )
    }

    const currentStepInfo = stepInfo[step]

    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-sm text-slate-400 font-light leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>
            <input autoFocus className="w-full p-4 bg-slate-50 border border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl text-slate-900 font-medium text-base outline-none transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-300" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do titular" />
            <button onClick={nextStep} disabled={!name.trim()} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]">Avançar <ArrowRight size={16} /></button>
          </div>
        )
      case 2:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-sm text-slate-400 font-light leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>
            <input type="date" className="w-full p-4 bg-slate-50 border border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl text-slate-900 font-medium text-base outline-none transition-all cursor-pointer" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            <button onClick={nextStep} disabled={!birthDate} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]">Avançar <ArrowRight size={16} /></button>
          </div>
        )
      case 3:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-sm text-slate-400 font-light leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>
            <div className="relative">
              <select className="w-full p-4 bg-slate-50 border border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl text-slate-800 font-semibold text-sm outline-none transition-all appearance-none cursor-pointer" value={province} onChange={e => setProvince(e.target.value)}>
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
            </div>
            <button onClick={nextStep} disabled={!province} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]">Avançar <ArrowRight size={16} /></button>
          </div>
        )
      case 4:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-sm text-slate-400 font-light leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>
            <div className="space-y-3">
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 font-bold text-sm bg-slate-200/40 px-2.5 py-1 rounded-xl">+258</span>
                <input type="tel" className="w-full p-4 pl-20 bg-slate-50 border border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl text-slate-900 font-semibold text-base outline-none transition-all" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="84XXXXXXX" maxLength={9} />
              </div>
              <p className="text-[11px] text-slate-400 text-center font-normal">Operadoras homologadas: Vodacom, Movitel ou mcel</p>
            </div>
            <button onClick={nextStep} disabled={phone.length !== 9} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]">Avançar <ArrowRight size={16} /></button>
          </div>
        )
      case 5:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-sm text-slate-400 font-light leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>
            <select className="w-full p-4 bg-slate-50 border border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl text-slate-800 font-semibold text-sm outline-none transition-all appearance-none cursor-pointer" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}>
              <option value="">SELECIONE O FLUXO</option>
              <option value="1000">Até R$ 1.000,00 diários</option>
              <option value="5000">De R$ 1.000,00 a R$ 5.000,00</option>
              <option value="10000">Gerenciamento acima de R$ 5.000,00</option>
            </select>
            <button onClick={nextStep} disabled={!dailyLimit} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]">Avançar <ArrowRight size={16} /></button>
          </div>
        )
      case 6:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-sm text-slate-400 font-light leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>
            <div className="space-y-4">
              <div className="relative flex items-center">
                <input type={showPass ? 'text' : 'password'} className="w-full p-4 bg-slate-50 border border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl text-slate-900 font-semibold text-base outline-none pr-12 transition-all placeholder:text-slate-400" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha (mínimo 8 caracteres)" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 text-slate-400 hover:text-slate-600">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <input type={showPass ? 'text' : 'password'} className="w-full p-4 bg-slate-50 border border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl text-slate-900 font-semibold text-base outline-none transition-all placeholder:text-slate-400" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirme a sua senha" />
            </div>
            <button onClick={nextStep} disabled={password.length < 8 || password !== confirmPassword} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm tracking-wide active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed">Avançar</button>
          </div>
        )
      case 7:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                {docStep === 'frente' && 'Enquadre a FRENTE do documento em um local iluminado.'}
                {docStep === 'verso' && 'Perfeito! Agora enquadre o VERSO do mesmo documento.'}
                {docStep === 'previa' && 'Tudo pronto. Suas imagens foram anexadas de forma segura.'}
              </p>
            </div>

            {docStep === 'frente' && (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-12 bg-slate-50/50 cursor-pointer hover:bg-indigo-50/10 hover:border-indigo-400/50 transition-all group">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="font-semibold text-xs text-slate-700 tracking-wide">Fotografar Frente</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e, 'front')} />
              </label>
            )}

            {docStep === 'verso' && (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-12 bg-slate-50/50 cursor-pointer hover:bg-indigo-50/10 hover:border-indigo-400/50 transition-all group animate-in fade-in duration-300">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="font-semibold text-xs text-slate-700 tracking-wide">Fotografar Verso</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e, 'back')} />
              </label>
            )}

            {docStep === 'previa' && (
              <div className="space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Arquivos Processados</p>
                    <p className="text-[11px] text-emerald-700 font-light mt-0.5">As imagens serão apagadas automaticamente após a validação.</p>
                  </div>
                </div>
                <button onClick={handleDocumentSubmit} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm tracking-wide transition-all active:scale-[0.98]">
                  Enviar e finalizar cadastro
                </button>
              </div>
            )}
          </div>
        )
      case 8:
        return (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 py-4 text-center">
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl scale-125"></div>
              <div className="p-4 bg-emerald-500 rounded-full shadow-lg border-4 border-white">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Conta criada!</h1>
            <p className="text-sm font-light text-slate-400 mt-2 max-w-xs leading-relaxed">
              Seja bem-vindo, <span className="font-semibold text-slate-700">{name.split(' ')[0]}</span>. Seu acesso à infraestrutura digital **BankPix** já está pronto.
            </p>
            <div className="w-full mt-8 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 text-left">
              <div className="p-2 bg-indigo-50 rounded-xl"><Sparkles className="w-4 h-4 text-indigo-600" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status da conta</p>
                <p className="text-xs font-semibold text-slate-700">Chaves integradas com sucesso</p>
              </div>
            </div>
            <button onClick={handleCompleteRegistration} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm tracking-wide transition-all active:scale-[0.98] mt-6">
              Acessar Painel Principal
            </button>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 antialiased text-slate-900">
      <div className="w-full max-w-md bg-white rounded-[32px] p-10 border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] relative min-h-[540px] flex flex-col justify-between">
        
        {step < 8 && mode === 'register' && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <button onClick={() => {
                    if (step === 7 && docStep !== 'frente') {
                      setDocStep(docStep === 'previa' ? 'verso' : 'frente')
                    } else {
                      setStep(step - 1)
                    }
                  }} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-500 transition-colors">
                    <ArrowLeft size={14}/>
                  </button>
                )}
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50/60 px-3 py-1 rounded-full">
                  Passo {step} de {totalSteps}
                </span>
              </div>
              
              <button 
                onClick={() => setMode('login')} 
                className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                Sair
              </button>
            </div>
            
            {/* Barra de Progresso Minimalista de Linha Única */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500 ease-out rounded-full" 
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center">
          {mode === 'register' ? renderStepContent() : null}
        </div>

      </div>
    </div>
  )
}
