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

  // --- 1. PROCESSO SEGURO (PRE-LINK) ---
  if (preLinkLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white p-6 text-center antialiased">
        <div className="relative w-16 h-16 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-purple-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
          <ShieldCheck className="w-6 h-6 text-purple-500" />
        </div>
        <h1 className="text-xs font-bold tracking-[0.2em] text-purple-500 uppercase mb-2">
          Ambiente Criptografado
        </h1>
        <p className="text-sm text-neutral-400 max-w-xs font-light">
          Estabelecendo conexão segura com os servidores centrais.
        </p>
      </div>
    )
  }

  // --- 2. PROCESSAMENTO FINAL ---
  if (finalLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black p-6 text-center antialiased">
        <div className="w-full max-w-sm space-y-8">
          <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-purple-600/20 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Análise do Sistema</h2>
            <p className="text-lg font-medium text-white h-14 flex items-center justify-center px-4 transition-all duration-300">
              {loadingMessage || 'Processando requisição...'}
            </p>
          </div>
          <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full w-2/3 animate-[pulse_1.5s_infinite] rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  // --- 3. LOGIN INTERFACE ---
  if (mode === 'login') {
    return (
      <div className="min-h-screen w-full bg-white text-black antialiased flex flex-col justify-between p-6 md:max-w-md md:mx-auto md:shadow-2xl md:my-4 md:rounded-[40px] md:min-h-[850px]">
        <div>
          <div className="flex justify-between items-center pt-4 mb-16">
            <span className="text-xl font-bold tracking-tight text-black">
              Bank<span className="text-purple-600">Pix</span>
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-8">Olá! Digite seu telefone e senha para entrar.</h1>
          
          <form onSubmit={handleActualLogin} className="space-y-6">
            <div className="border-b border-neutral-200 focus-within:border-purple-600 transition-colors py-2">
              <input 
                type="tel" placeholder="Telefone ou chave digital" 
                className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-neutral-300"
                value={phone} onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="border-b border-neutral-200 focus-within:border-purple-600 transition-colors py-2 flex items-center justify-between">
              <input 
                type={showPass ? 'text' : 'password'} placeholder="Senha de acesso" 
                className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-neutral-300"
                value={password} onChange={e => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="text-neutral-400 hover:text-neutral-600 px-2">
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4 pt-6">
          <button 
            onClick={handleActualLogin}
            disabled={!phone || !password}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-100 text-white disabled:text-neutral-400 rounded-full font-semibold text-base transition-all flex items-center justify-center gap-2"
          >
            Continuar
          </button>
          
          <button 
            onClick={() => { setMode('register'); setStep(1); setDocStep('frente'); }}
            className="w-full py-4 text-purple-600 hover:bg-neutral-50 rounded-full font-semibold text-sm transition-all"
          >
            Criar conta nova
          </button>
        </div>
      </div>
    )
  }

  const stepTitles: { [key: number]: { title: string; subtitle: string } } = {
    1: { title: "Qual é o seu nome completo?", subtitle: "Deve ser igual ao que está impresso no seu documento." },
    2: { title: "Qual é a sua data de nascimento?", subtitle: "Precisamos disso para confirmar sua maioridade." },
    3: { title: "Em qual província você mora?", subtitle: "Selecione a sua localização atual de residência." },
    4: { title: "Qual é o número do seu celular?", subtitle: "Use o seu número principal para proteger a conta." },
    5: { title: "Qual seu fluxo diário estimado?", subtitle: "Escolha o limite ideal para as suas movimentações." },
    6: { title: "Crie uma senha de acesso", subtitle: "Defina uma combinação segura com no mínimo 8 caracteres." },
    7: { title: "Agora, tire uma foto do documento", subtitle: "Precisamos validar suas fotos biométricas para ativação." }
  }

  return (
    <div className="min-h-screen w-full bg-white text-black antialiased flex flex-col justify-between p-6 md:max-w-md md:mx-auto md:shadow-2xl md:my-4 md:rounded-[40px] md:min-h-[850px]">
      
      {/* Cabeçalho e Progresso */}
      {step < 8 && (
        <div>
          <div className="flex justify-between items-center pt-4 mb-8">
            {step > 1 ? (
              <button onClick={() => {
                if (step === 7 && docStep !== 'frente') {
                  setDocStep(docStep === 'previa' ? 'verso' : 'frente')
                } else {
                  setStep(step - 1)
                }
              }} className="text-neutral-800 p-1">
                <ArrowLeft size={24}/>
              </button>
            ) : (
              <button onClick={() => setMode('login')} className="text-neutral-800 p-1">
                <ArrowLeft size={24}/>
              </button>
            )}
            
            <span className="text-xs font-semibold text-neutral-400">
              {step} de {totalSteps}
            </span>
          </div>

          <div className="w-full h-[3px] bg-neutral-100 mb-12 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-600 transition-all duration-300 ease-out" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          {/* Conteúdo Dinâmico dos Passos */}
          {isProcessing ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="space-y-3">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 leading-tight">
                  {stepTitles[step]?.title}
                </h1>
                <p className="text-sm text-neutral-400 font-light">
                  {step === 7 && docStep === 'frente' && 'Posicione a FRENTE do documento.'}
                  {step === 7 && docStep === 'verso' && 'Ótimo! Agora capture o VERSO.'}
                  {step === 7 && docStep === 'previa' && 'Imagens salvas localmente.'}
                  {step !== 7 && stepTitles[step]?.subtitle}
                </p>
              </div>

              {/* INPUTS ESTILO APLICATIVO NATIVO */}
              {step === 1 && (
                <div className="border-b border-neutral-200 focus-within:border-purple-600 transition-colors py-2">
                  <input autoFocus className="w-full bg-transparent text-xl font-medium outline-none uppercase placeholder:normal-case placeholder:text-neutral-300" value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" />
                </div>
              )}

              {step === 2 && (
                <div className="border-b border-neutral-200 focus-within:border-purple-600 transition-colors py-2">
                  <input type="date" className="w-full bg-transparent text-xl font-medium outline-none cursor-pointer text-neutral-800" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                </div>
              )}

              {step === 3 && (
                <div className="border-b border-neutral-200 focus-within:border-purple-600 transition-colors py-2">
                  <select className="w-full bg-transparent text-lg font-medium outline-none cursor-pointer text-neutral-800 appearance-none" value={province} onChange={e => setProvince(e.target.value)}>
                    <option value="">Selecione sua província</option>
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
              )}

              {step === 4 && (
                <div className="space-y-2">
                  <div className="border-b border-neutral-200 focus-within:border-purple-600 transition-colors py-2 flex items-center gap-3">
                    <span className="text-xl font-bold text-neutral-400">+258</span>
                    <input type="tel" className="w-full bg-transparent text-xl font-medium outline-none" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="84XXXXXXX" maxLength={9} />
                  </div>
                  <p className="text-xs text-neutral-400 font-light">Suporta Vodacom, Movitel ou mcel.</p>
                </div>
              )}

              {step === 5 && (
                <div className="border-b border-neutral-200 focus-within:border-purple-600 transition-colors py-2">
                  <select className="w-full bg-transparent text-lg font-medium outline-none cursor-pointer text-neutral-800 appearance-none" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}>
                    <option value="">Escolha uma faixa</option>
                    <option value="1000">Até R$ 1.000,00 por dia</option>
                    <option value="5000">De R$ 1.000,00 a R$ 5.000,00</option>
                    <option value="10000">Acima de R$ 5.000,00</option>
                  </select>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <div className="border-b border-neutral-200 focus-within:border-purple-600 transition-colors py-2 flex items-center justify-between">
                    <input type={showPass ? 'text' : 'password'} className="w-full bg-transparent text-xl font-medium outline-none placeholder:text-neutral-300" value={password} onChange={e => setPassword(e.target.value)} placeholder="Criar senha" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-neutral-400">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  <div className="border-b border-neutral-200 focus-within:border-purple-600 transition-colors py-2">
                    <input type={showPass ? 'text' : 'password'} className="w-full bg-transparent text-xl font-medium outline-none placeholder:text-neutral-300" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar senha" />
                  </div>
                </div>
              )}

              {step === 7 && (
                <div className="space-y-4">
                  {(docStep === 'frente' || docStep === 'verso') && (
                    <label className="flex flex-col items-center justify-center border border-dashed border-neutral-300 rounded-2xl p-12 bg-neutral-50 cursor-pointer hover:bg-neutral-100/60 transition-all">
                      <UploadCloud className="w-6 h-6 text-purple-600 mb-2" />
                      <span className="text-sm font-semibold text-neutral-700">Tirar Foto do Documento</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e, docStep === 'frente' ? 'front' : 'back')} />
                    </label>
                  )}

                  {docStep === 'previa' && (
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                      <p className="text-xs font-bold text-neutral-800 uppercase">Imagens prontas para envio</p>
                      <p className="text-xs text-neutral-500 font-light">As capturas foram anexadas com criptografia de ponta a ponta.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TELA DE SUCESSO COMPLETO */}
      {step === 8 && (
        <div className="flex-1 flex flex-col justify-between py-6 text-left animate-in fade-in duration-500">
          <div className="space-y-8 pt-12">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Tudo pronto! Sua conta foi ativada.</h1>
              <p className="text-sm text-neutral-500 font-light leading-relaxed">
                Parabéns, <span className="font-semibold text-neutral-800">{name.split(' ')[0]}</span>. Sua infraestrutura financeira na rede **BankPix** foi provisionada.
              </p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-2xl flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs font-bold text-neutral-800">Status Operacional</p>
                <p className="text-xs text-neutral-500">Chaves Pix e serviços integrados</p>
              </div>
            </div>
          </div>

          <button onClick={handleCompleteRegistration} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold text-base transition-all active:scale-[0.98]">
            Acessar painel
          </button>
        </div>
      )}

      {/* BOTÃO FIXO DE AÇÃO INFERIOR DO CADASTRO */}
      {step < 8 && mode === 'register' && !isProcessing && (
        <div className="pt-6">
          <button 
            onClick={step === 7 && docStep === 'previa' ? handleDocumentSubmit : nextStep}
            disabled={
              (step === 1 && !name.trim()) ||
              (step === 2 && !birthDate) ||
              (step === 3 && !province) ||
              (step === 4 && phone.length !== 9) ||
              (step === 5 && !dailyLimit) ||
              (step === 6 && (password.length < 8 || password !== confirmPassword)) ||
              (step === 7 && docStep !== 'previa')
            }
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-100 text-white disabled:text-neutral-400 rounded-full font-semibold text-base transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {step === 7 && docStep === 'previa' ? 'Concluir cadastro' : 'Continuar'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}

    </div>
  )
}
