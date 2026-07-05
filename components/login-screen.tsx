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
      }, 3000)
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

  // --- DESIGN DE SERVIDOR SEGURO (PRE-LINK) ---
  if (preLinkLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center antialiased">
        <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
          <div className="absolute w-16 h-16 inset-4 border border-dashed border-cyan-400/30 rounded-full animate-reverse-spin"></div>
          <ShieldCheck className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>
        <h1 className="text-sm font-bold tracking-[0.25em] text-cyan-400 uppercase mb-2 animate-pulse">
          Criptografia SSL de Ponta a Ponta
        </h1>
        <p className="text-xs text-slate-500 max-w-xs font-light">Autenticando token do dispositivo no servidor de segurança corporativo.</p>
      </div>
    )
  }

  // --- DESIGN DE PROCESSAMENTO GERAL (FINAL LOADING) ---
  if (finalLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center antialiased">
        <div className="w-full max-w-xs bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-blue-600/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Análise Cadastral</h2>
          <p className="text-base font-semibold text-white tracking-wide transition-all duration-300">
            {loadingMessage || 'Processando requisição...'}
          </p>
          <div className="mt-4 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full w-2/3 animate-[pulse_1.5s_infinite] rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  // --- DESIGN DE LOGIN PREMIUM ---
  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 p-4 antialiased">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] p-8 border border-slate-100/80 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-xl shadow-blue-500/20">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Bank<span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent font-medium">Pix</span>
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-1.5 tracking-wide">Acesse sua plataforma financeira digital</p>
          </div>
          
          <form onSubmit={handleActualLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Identificação do Usuário</label>
              <input 
                type="tel" placeholder="Telefone ou chave digital" 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-medium text-sm outline-none focus:border-blue-500/50 focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.05)] transition-all"
                value={phone} onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Credencial de Segurança</label>
              <input 
                type="password" placeholder="Senha cadastrada" 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-medium text-sm outline-none focus:border-blue-500/50 focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.05)] transition-all"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold text-sm tracking-wide transition-all active:scale-[0.99] shadow-xl shadow-blue-600/15 hover:opacity-95 mt-2">
              Autenticar e Entrar
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button 
              onClick={() => { setMode('register'); setStep(1); setDocStep('frente'); }}
              className="w-full py-3.5 bg-slate-50 hover:bg-slate-100/80 text-blue-600 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all border border-slate-100"
            >
              Criar Conta Pessoal Gratuita
            </button>
          </div>
        </div>
      </div>
    )
  }

  const stepInfo: { [key: number]: { icon: React.ReactNode; title: string; subtitle: string } } = {
    1: { icon: <User className="w-5 h-5 text-blue-600" />, title: "Nome do Titular", subtitle: "Preencha o nome de forma idêntica ao documento" },
    2: { icon: <Calendar className="w-5 h-5 text-blue-600" />, title: "Data de Nascimento", subtitle: "Utilizada para conformidade e maioridade legal" },
    3: { icon: <MapPin className="w-5 h-5 text-blue-600" />, title: "Domicílio Fiscal", subtitle: "Selecione a província onde reside atualmente" },
    4: { icon: <Phone className="w-5 h-5 text-blue-600" />, title: "Terminal Móvel", subtitle: "O número de telefone principal servirá como login seguro" },
    5: { icon: <BarChart3 className="w-5 h-5 text-blue-600" />, title: "Volume Operacional", subtitle: "Defina a estimativa padrão de limites diários" },
    6: { icon: <Lock className="w-5 h-5 text-blue-600" />, title: "Código de Segurança", subtitle: "Defina uma senha robusta para assinar transações" },
    7: { icon: <ShieldCheck className="w-5 h-5 text-blue-600" />, title: "Verificação Biométrica", subtitle: "Comprovação digital por captura fotográfica" }
  }

  const renderStepContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center py-14 space-y-4">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-blue-600/20 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] animate-pulse">
            {loadingMessage || 'Processamento seguro...'}
          </p>
        </div>
      )
    }

    const currentStepInfo = stepInfo[step]

    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-left">
              <div className="inline-flex p-2.5 bg-blue-50 border border-blue-100/50 rounded-xl mb-3">{currentStepInfo.icon}</div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1 font-light">{currentStepInfo.subtitle}</p>
            </div>
            <div className="relative">
              <input autoFocus className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-semibold text-base outline-none focus:border-blue-500/50 focus:bg-white transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-300" value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" />
            </div>
            <button onClick={nextStep} disabled={!name.trim()} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-600/10">Continuar <ArrowRight size={16} /></button>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-left">
              <div className="inline-flex p-2.5 bg-blue-50 border border-blue-100/50 rounded-xl mb-3">{currentStepInfo.icon}</div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1 font-light">{currentStepInfo.subtitle}</p>
            </div>
            <input type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-semibold text-base outline-none focus:border-blue-500/50 focus:bg-white transition-all" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            <button onClick={nextStep} disabled={!birthDate} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-600/10">Continuar <ArrowRight size={16} /></button>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-left">
              <div className="inline-flex p-2.5 bg-blue-50 border border-blue-100/50 rounded-xl mb-3">{currentStepInfo.icon}</div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1 font-light">{currentStepInfo.subtitle}</p>
            </div>
            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-semibold text-sm outline-none focus:border-blue-500/50 focus:bg-white transition-all appearance-none cursor-pointer" value={province} onChange={e => setProvince(e.target.value)}>
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
            <button onClick={nextStep} disabled={!province} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-600/10">Continuar <ArrowRight size={16} /></button>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-left">
              <div className="inline-flex p-2.5 bg-blue-50 border border-blue-100/50 rounded-xl mb-3">{currentStepInfo.icon}</div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1 font-light">{currentStepInfo.subtitle}</p>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm bg-slate-200/50 px-2 py-1 rounded-lg">+258</span>
              <input type="tel" className="w-full p-4 pl-20 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-semibold text-base outline-none focus:border-blue-500/50 focus:bg-white transition-all" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="84XXXXXXX" maxLength={9} />
            </div>
            <p className="text-[10px] text-slate-400 text-center font-medium">Operadoras homologadas: Vodacom, Movitel ou mcel</p>
            <button onClick={nextStep} disabled={phone.length !== 9} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-600/10">Continuar <ArrowRight size={16} /></button>
          </div>
        )
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-left">
              <div className="inline-flex p-2.5 bg-blue-50 border border-blue-100/50 rounded-xl mb-3">{currentStepInfo.icon}</div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1 font-light">{currentStepInfo.subtitle}</p>
            </div>
            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-semibold text-sm outline-none focus:border-blue-500/50 focus:bg-white transition-all appearance-none cursor-pointer" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}>
              <option value="">SELECIONE O FLUXO</option>
              <option value="1000">Até R$ 1.000,00 diários</option>
              <option value="5000">De R$ 1.000,00 a R$ 5.000,00</option>
              <option value="10000">Gereciamento acima de R$ 5.000,00</option>
            </select>
            <button onClick={nextStep} disabled={!dailyLimit} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-600/10">Continuar <ArrowRight size={16} /></button>
          </div>
        )
      case 6:
        return (
          <div className="space-y-4">
            <div className="text-left">
              <div className="inline-flex p-2.5 bg-blue-50 border border-blue-100/50 rounded-xl mb-3">{currentStepInfo.icon}</div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1 font-light">{currentStepInfo.subtitle}</p>
            </div>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-semibold text-base outline-none focus:border-blue-500/50 focus:bg-white pr-12 transition-all" value={password} onChange={e => setPassword(e.target.value)} placeholder="Definir nova senha" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <input type={showPass ? 'text' : 'password'} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-semibold text-base outline-none focus:border-blue-500/50 focus:bg-white transition-all" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar combinação" />
            <p className="text-[10px] text-slate-400 text-center font-medium">Requisito mínimo: 8 caracteres alfanuméricos</p>
            <button onClick={nextStep} disabled={password.length < 8 || password !== confirmPassword} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold text-sm tracking-wide shadow-xl shadow-blue-600/10 mt-2 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed">Continuar</button>
          </div>
        )
      case 7: // --- SEÇÃO EXCLUSIVA DE VERIFICAÇÃO BIOMÉTRICA DE DOCUMENTOS ---
        return (
          <div className="space-y-5">
            <div className="text-left">
              <div className="inline-flex p-2.5 bg-blue-50 border border-blue-100/50 rounded-xl mb-3">{currentStepInfo.icon}</div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{currentStepInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-1 font-light">
                {docStep === 'frente' && 'Posicione a FRENTE do documento dentro da moldura clara.'}
                {docStep === 'verso' && 'Captura concluída! Agora tire foto do VERSO do mesmo documento.'}
                {docStep === 'previa' && 'Validação digital: imagens anexadas e prontas para processamento.'}
              </p>
            </div>

            {docStep === 'frente' && (
              <label className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl p-10 bg-slate-50/50 cursor-pointer hover:bg-blue-50/20 hover:border-blue-400/50 transition-all group">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Fotografar Frente</span>
                <span className="text-[10px] text-slate-400 mt-1 font-light">Garanta boa iluminação</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e, 'front')} />
              </label>
            )}

            {docStep === 'verso' && (
              <label className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl p-10 bg-slate-50/50 cursor-pointer hover:bg-blue-50/20 hover:border-blue-400/50 transition-all group animate-in fade-in duration-300">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Fotografar Verso</span>
                <span className="text-[10px] text-slate-400 mt-1 font-light">Verso legível e sem reflexos</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e, 'back')} />
              </label>
            )}

            {docStep === 'previa' && (
              <div className="space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Imagens Escaneadas</p>
                    <p className="text-[10px] text-emerald-600/80 font-light">Pronto para envio seguro com descarte automatizado.</p>
                  </div>
                </div>
                <button onClick={handleDocumentSubmit} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold text-sm tracking-wide shadow-xl shadow-blue-600/10 transition-all active:scale-[0.99]">
                  Enviar e Concluir Fluxo
                </button>
              </div>
            )}
          </div>
        )
      case 8: // --- TELA FINAL DE ANIMAÇÃO DE CONTA ABERTA ---
        return (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 py-6 text-center">
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl scale-125 animate-pulse"></div>
              <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full shadow-xl shadow-emerald-500/20 border-4 border-white">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Conta Ativada com Sucesso</h1>
            <p className="text-xs font-light text-slate-400 mt-2 max-w-xs leading-relaxed">
              Parabéns, <span className="font-semibold text-slate-700">{name.split(' ')[0]}</span>! Sua infraestrutura na rede global do **BankPix** foi provisionada com êxito.
            </p>
            <div className="w-full mt-8 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 text-left">
              <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl"><Sparkles className="w-4 h-4 text-blue-600" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status operacional</p>
                <p className="text-xs font-bold text-slate-700">Chaves Pix e M-Pesa Prontas</p>
              </div>
            </div>
            <button onClick={handleCompleteRegistration} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-sm tracking-wider uppercase shadow-xl shadow-blue-600/20 transition-all active:scale-[0.99] mt-6">
              Acessar Painel Financeiro
            </button>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/10 to-slate-100 p-4 antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.05)] p-7 border border-slate-100/80 relative">
        {step < 8 && mode === 'register' && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                {step > 1 && (
                  <button onClick={() => {
                    if (step === 7 && docStep !== 'frente') {
                      setDocStep(docStep === 'previa' ? 'verso' : 'frente')
                    } else {
                      setStep(step - 1)
                    }
                  }} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                    <ArrowLeft size={14}/>
                  </button>
                )}
                <span className="text-[10px] font-extrabold tracking-widest text-blue-600 uppercase bg-blue-50 border border-blue-100/50 px-3 py-1.5 rounded-xl">
                  Etapa {step} de {totalSteps}
                </span>
              </div>
              
              <span className="text-xs font-medium text-slate-400 tracking-tight">
                {stepsRemaining === 1 ? 'Análise final próxima' : `${stepsRemaining} etapas pendentes`}
              </span>
            </div>
            
            {/* Barra de Progresso Minimalista High-Tech */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out rounded-full" 
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
