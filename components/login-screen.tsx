'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, ArrowLeft, Phone, User, Lock, CheckCircle, Wallet, Calendar, BarChart3, MapPin, Eye, EyeOff, ShieldCheck, Sparkles, UploadCloud, Zap } from 'lucide-react'
import { showInstallPrompt } from './install-prompt'
import { registerUserAndLinkPush } from '@/lib/register-user'

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
    e.preventDefault();

    const savedData = localStorage.getItem(`bankpix_user_${phone}`);

    if (!savedData) {
      alert("Conta não encontrada. Por favor, crie uma nova conta.");
      return;
    }

    try {
      const userData = JSON.parse(savedData);

      if (userData.password !== password) {
        alert("Senha incorreta!");
        return;
      }

      setPreLinkLoading(true);

      const params = new URLSearchParams(window.location.search);
      const isVip = params.get('acesso') === 'vip' || params.get('plano') === 'vip';

      // Recupera (ou cria, se faltar) o usuário real e vincula o push ao seu id
      await registerUserAndLinkPush({
        name: userData.name || '',
        phone,
        accessType: isVip ? 'VIP' : 'FREE',
        newAccount: false,
      });

      await new Promise((r) => setTimeout(r, 6000));

      setPreLinkLoading(false);

      onLogin(userData);
    } catch (error) {
      console.error("Erro ao realizar login:", error);

      setPreLinkLoading(false);

      alert("Ocorreu um erro ao entrar na conta.");
    }
  };

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
    // ⏳ AJUSTE DO TEMPO 1: Agora aguarda 10 segundos
    await new Promise(r => setTimeout(r, 10000))
    setPreLinkLoading(false)

    setFinalLoading(true)

    // 1. Determina o plano (free/vip) e firstName
    const params = new URLSearchParams(window.location.search)
    const isVip = params.get('acesso') === 'vip' || params.get('plano') === 'vip'
    const planoAtual = isVip ? 'VIP' : 'FREE'

    // Cria o usuário no servidor, vincula a inscrição de push e dispara
    // a notificação "conta aprovada" (ver lib/push-config.ts).
    const userId = await registerUserAndLinkPush({
      name: name.trim(),
      phone,
      accessType: planoAtual,
      newAccount: true,
    })

    if (userId) {
      console.log('Usuário cadastrado e vinculado ao Push:', userId)
    }

    // ⏳ AJUSTE DO TEMPO 2: Agora aguarda mais 10 segundos (Totalizando 20 segundos)
    await new Promise(r => setTimeout(r, 10000))

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

  // --- LOADING PRÉ-LINK PREMIUM ---
  if (preLinkLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 p-6 text-center antialiased select-none">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative z-10">
          <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 border-3 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-transparent border-t-blue-600 border-r-indigo-500 rounded-full animate-spin"></div>
            <ShieldCheck className="w-10 h-10 text-blue-600 animate-pulse" />
          </div>
          <h1 className="text-xl font-black tracking-widest text-blue-900 uppercase mb-3 animate-pulse">
            Conexão Segura
          </h1>
          <p className="text-base text-blue-700 max-w-xs font-semibold leading-relaxed">
            Autenticando as chaves do seu dispositivo em ambiente corporativo de alta segurança.
          </p>
        </div>
      </div>
    )
  }

  // --- LOADING FINAL PREMIUM ---
  if (finalLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-950 p-6 text-center antialiased">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        </div>

        <div className="w-full max-w-sm bg-gradient-to-br from-blue-800/40 to-indigo-800/40 border border-blue-600/30 rounded-3xl p-8 backdrop-blur-2xl relative z-10 shadow-2xl">
          <div className="relative w-16 h-16 mx-auto mb-8 flex items-center justify-center">
            <div className="absolute inset-0 border-3 border-blue-400/20 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-transparent border-t-blue-400 border-r-cyan-400 rounded-full animate-spin"></div>
            <Zap className="w-7 h-7 text-blue-300 animate-pulse" />
          </div>
          <h2 className="text-sm font-bold text-blue-200 uppercase tracking-widest mb-4">Análise Avançada</h2>
          <p className="text-lg font-semibold text-blue-50 h-16 flex items-center justify-center px-4 transition-all duration-300 animate-pulse">
            {loadingMessage || 'Processando requisição...'}
          </p>
          <div className="mt-8 w-full bg-blue-900/50 h-2 rounded-full overflow-hidden border border-blue-600/30">
            <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full w-3/4 animate-[pulse_1.5s_infinite] rounded-full shadow-lg shadow-blue-400/50"></div>
          </div>
        </div>
      </div>
    )
  }

  // --- LOGIN PREMIUM AZULADO ---
  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 antialiased">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        </div>

        <div className="w-full max-w-md bg-white rounded-[40px] p-10 border border-blue-100 shadow-2xl flex flex-col justify-between relative min-h-[600px] z-10">
          
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tight text-blue-900">
                Bank<span className="text-blue-600 font-black">Pix</span>
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-blue-900 mb-3 leading-tight">Bem-vindo de volta!</h1>
            <p className="text-base text-blue-600 font-semibold mb-10">Acesse sua conta com suas credenciais.</p>
            
            <form onSubmit={handleActualLogin} className="space-y-6">
              <div className="relative flex items-center">
                <User className="absolute left-5 w-5 h-5 text-blue-400" />
                <input 
                  type="tel" placeholder="Seu telefone ou chave" 
                  className="w-full p-5 pl-14 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-transparent rounded-3xl text-blue-900 font-semibold text-base outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-blue-300"
                  value={phone} onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div className="relative flex items-center">
                <Lock className="absolute left-5 w-5 h-5 text-blue-400" />
                <input 
                  type={showPass ? 'text' : 'password'} placeholder="Sua senha segura" 
                  className="w-full p-5 pl-14 pr-14 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-transparent rounded-3xl text-blue-900 font-semibold text-base outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-blue-300"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 text-blue-400 hover:text-blue-600 transition-colors">
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button type="submit" className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl font-bold text-lg tracking-wide transition-all shadow-lg hover:shadow-xl active:scale-[0.98] mt-6">
                Entrar agora
              </button>
            </form>
          </div>

          <div className="mt-10 pt-8 border-t border-blue-100">
            <button 
              onClick={() => { setMode('register'); setStep(1); setDocStep('frente'); }}
              className="w-full py-5 text-blue-600 hover:bg-blue-50 rounded-3xl font-bold text-lg transition-all"
            >
              Criar conta gratuita
            </button>
          </div>

        </div>
      </div>
    )
  }

  const stepInfo: { [key: number]: { icon: React.ReactNode; title: string; subtitle: string } } = {
    1: { icon: <User className="w-7 h-7 text-blue-600" />, title: "Qual é o seu NOME COMPLETO?", subtitle: "Preencha exatamente como consta no seu documento oficial." },
    2: { icon: <Calendar className="w-7 h-7 text-blue-600" />, title: "Quando você nasceu?", subtitle: "Data de nascimento para validação de maioridade legal." },
    3: { icon: <MapPin className="w-7 h-7 text-blue-600" />, title: "Onde você RESIDE?", subtitle: "Selecione a sua localização de domicílio fiscal." },
    4: { icon: <Phone className="w-7 h-7 text-blue-600" />, title: "Qual seu TELEFONE?", subtitle: "Este será seu identificador único e seguro de login." },
    5: { icon: <BarChart3 className="w-7 h-7 text-blue-600" />, title: "Qual seu LIMITE DIÁRIO?", subtitle: "Defina seu volume operacional de movimentação." },
    6: { icon: <Lock className="w-7 h-7 text-blue-600" />, title: "Crie sua SENHA DE SEGURANÇA", subtitle: "Use uma combinação forte para suas transações." },
    7: { icon: <ShieldCheck className="w-7 h-7 text-blue-600" />, title: "VERIFICAÇÃO DE IDENTIDADE", subtitle: "Capture imagem nítida do seu documento." }
  }

  const renderStepContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 border-3 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-bold text-blue-600 tracking-wide animate-pulse">Salvando com segurança...</p>
        </div>
      )
    }

    const currentStepInfo = stepInfo[step]

    switch (step) {
      case 1:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-500">
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-blue-900 tracking-tight leading-tight">{currentStepInfo.title}</h2>
              <p className="text-lg text-blue-600 font-semibold leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>
            <input autoFocus className="w-full p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-3xl text-blue-900 font-bold text-xl outline-none transition-all uppercase placeholder:normal-case placeholder:font-semibold placeholder:text-blue-300" value={name} onChange={e => setName(e.target.value)} placeholder="Digite seu nome" />
            <button onClick={nextStep} disabled={!name.trim()} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl font-bold text-lg tracking-wide flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg">Próximo <ArrowRight size={22} /></button>
          </div>
        )
      case 2:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-500">
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-blue-900 tracking-tight leading-tight">{currentStepInfo.title}</h2>
              <p className="text-lg text-blue-600 font-semibold leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>
            <input type="date" className="w-full p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-3xl text-blue-900 font-bold text-lg outline-none transition-all cursor-pointer" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            <button onClick={nextStep} disabled={!birthDate} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl font-bold text-lg tracking-wide flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg">Próximo <ArrowRight size={22} /></button>
          </div>
        )
      case 3:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-500">
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-blue-900 tracking-tight leading-tight">{currentStepInfo.title}</h2>
              <p className="text-lg text-blue-600 font-semibold leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>
            <div className="relative">
              <select className="w-full p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-3xl text-blue-900 font-bold text-lg outline-none transition-all appearance-none cursor-pointer" value={province} onChange={e => setProvince(e.target.value)}>
                <option value="">ESCOLHA A PROVÍNCIA</option>
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
            <button onClick={nextStep} disabled={!province} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl font-bold text-lg tracking-wide flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg">Próximo <ArrowRight size={22} /></button>
          </div>
        )
      case 4:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-500">
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-blue-900 tracking-tight leading-tight">{currentStepInfo.title}</h2>
              <p className="text-lg text-blue-600 font-semibold leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>
            <div className="space-y-4">
              <div className="relative flex items-center">
                <span className="absolute left-5 text-blue-600 font-black text-lg bg-blue-100 px-4 py-2 rounded-2xl">+258</span>
                <input type="tel" className="w-full p-5 pl-24 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-3xl text-blue-900 font-bold text-xl outline-none transition-all" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="84XXXXXXX" maxLength={9} />
              </div>
              <p className="text-sm text-blue-500 text-center font-semibold">Vodacom, Movitel ou mcel</p>
            </div>
            <button onClick={nextStep} disabled={phone.length !== 9} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl font-bold text-lg tracking-wide flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg">Próximo <ArrowRight size={22} /></button>
          </div>
        )
      case 5:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-500">
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-blue-900 tracking-tight leading-tight">{currentStepInfo.title}</h2>
              <p className="text-lg text-blue-600 font-semibold leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>
            <select className="w-full p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-3xl text-blue-900 font-bold text-lg outline-none transition-all appearance-none cursor-pointer" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}>
              <option value="">ESCOLHA O FLUXO</option>
              <option value="1000">Até R$ 1.000,00 diários</option>
              <option value="5000">De R$ 1.000,00 a R$ 5.000,00</option>
              <option value="10000">Acima de R$ 5.000,00</option>
            </select>
            <button onClick={nextStep} disabled={!dailyLimit} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl font-bold text-lg tracking-wide flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg">Próximo <ArrowRight size={22} /></button>
          </div>
        )
      case 6:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-500">
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-blue-900 tracking-tight leading-tight">{currentStepInfo.title}</h2>
              <p className="text-lg text-blue-600 font-semibold leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>
            <div className="space-y-5">
              <div className="relative flex items-center">
                <input type={showPass ? 'text' : 'password'} className="w-full p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-3xl text-blue-900 font-bold text-lg outline-none pr-14 transition-all placeholder:text-blue-300" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 text-blue-400 hover:text-blue-600">
                  {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
              <div className="relative flex items-center">
                <input type={showPass ? 'text' : 'password'} className="w-full p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-3xl text-blue-900 font-bold text-lg outline-none pr-14 transition-all placeholder:text-blue-300" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirme a senha" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 text-blue-400 hover:text-blue-600">
                  {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
              {password && confirmPassword && password === confirmPassword && <p className="text-base text-green-600 font-bold flex items-center gap-2"><CheckCircle size={20} /> Senhas coincidem!</p>}
            </div>
            <button onClick={nextStep} disabled={!password || password !== confirmPassword || password.length < 8} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl font-bold text-lg tracking-wide flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg">Próximo <ArrowRight size={22} /></button>
          </div>
        )
      case 7:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-500">
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-blue-900 tracking-tight leading-tight">{currentStepInfo.title}</h2>
              <p className="text-lg text-blue-600 font-semibold leading-relaxed">{currentStepInfo.subtitle}</p>
            </div>

            {!frontImage && docStep === 'frente' && (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-blue-300 rounded-3xl p-12 text-center hover:border-blue-500 transition-colors bg-blue-50">
                  <UploadCloud className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-lg font-bold text-blue-900 mb-2">Frente do Documento</p>
                  <p className="text-base text-blue-600 font-semibold">Clique para capturar</p>
                </div>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'front')} className="hidden" capture="environment" />
              </label>
            )}

            {frontImage && !backImage && docStep === 'verso' && (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-blue-300 rounded-3xl p-12 text-center hover:border-blue-500 transition-colors bg-blue-50">
                  <UploadCloud className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-lg font-bold text-blue-900 mb-2">Verso do Documento</p>
                  <p className="text-base text-blue-600 font-semibold">Clique para capturar</p>
                </div>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'back')} className="hidden" capture="environment" />
              </label>
            )}

            {frontImage && backImage && (
              <div className="space-y-4">
                <div className="bg-green-50 border-2 border-green-300 rounded-3xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-green-900">Frente capturada</p>
                    <p className="text-sm text-green-700">Documento recebido com sucesso</p>
                  </div>
                </div>
                <div className="bg-green-50 border-2 border-green-300 rounded-3xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-green-900">Verso capturado</p>
                    <p className="text-sm text-green-700">Documento recebido com sucesso</p>
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleDocumentSubmit} disabled={!frontImage || !backImage} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl font-bold text-lg tracking-wide flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg">Enviar Documentos <ArrowRight size={22} /></button>
          </div>
        )
      case 8:
        return (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-blue-900">Parabéns!</h2>
              <p className="text-xl text-blue-600 font-bold max-w-xs leading-relaxed">Sua conta foi criada com sucesso e está pronta para usar.</p>
            </div>
            <button onClick={handleCompleteRegistration} className="w-full py-5 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-3xl font-bold text-lg tracking-wide flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg mt-6">Começar Agora <Sparkles size={22} /></button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 antialiased">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-[40px] p-12 border border-blue-100 shadow-2xl relative z-10">
        
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest">Etapa {step} de 7</h3>
            <p className="text-xs font-bold text-blue-400 bg-blue-50 px-3 py-1 rounded-full">{stepsRemaining} etapas restantes</p>
          </div>
          <div className="w-full bg-blue-100 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Icon */}
        <div className="flex items-center justify-center mb-10">
          <div className="p-5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl">
            {stepInfo[step]?.icon}
          </div>
        </div>

        {/* Content */}
        {renderStepContent()}

        {/* Back Button */}
        {step > 1 && step < 8 && (
          <button 
            onClick={() => setStep(s => s - 1)} 
            className="mt-8 w-full py-4 text-blue-600 hover:bg-blue-50 rounded-3xl font-bold text-base transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} /> Voltar
          </button>
        )}
      </div>
    </div>
  )
}
