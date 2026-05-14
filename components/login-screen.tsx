'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Eye, EyeOff, Phone, User, Lock, CheckCircle, Wallet, Calendar, BarChart3 } from 'lucide-react'
import { LoadingSpinner } from './loading-spinner'
import { formatPhoneInput, validatePhone, validatePassword } from '@/lib/store'

interface UserData {
  name: string
  phone: string
  password: string
  province: string
  birthDate: string
  dailyLimit: string
  balance: number
  income: number
  keys: any[]
  transactions: any[]
}

interface LoginScreenProps {
  onLogin: (userData: UserData) => void
}

const creatingMessages = [
  'Validando documentos...',
  'Analisando perfil de crédito...',
  'Configurando limites diários...',
  'Conectando ao sistema de liquidação...',
  'Finalizando abertura de conta segura...'
]

const initialKeys: any[] = []
const initialTransactions: any[] = []

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [province, setProvince] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [dailyLimit, setDailyLimit] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [step, setStep] = useState<'form' | 'creating' | 'success' | 'entering'>('form')
  const [creatingMessageIndex, setCreatingMessageIndex] = useState(0)

  useEffect(() => {
    if (step === 'creating') {
      const interval = setInterval(() => {
        setCreatingMessageIndex(prev => (prev + 1) % creatingMessages.length)
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [step])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value)
    setPhone(formatted)
    setErrors((prev: any) => ({ ...prev, phone: undefined }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: any = {}

    if (!validatePhone(phone)) newErrors.phone = 'Número inválido'
    if (!password.trim()) newErrors.password = 'Digite sua senha'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const savedUser = localStorage.getItem(`bankpix_user_${phone}`)
    if (!savedUser) {
      setErrors({ phone: 'Conta não encontrada.' })
      return
    }

    const userData: UserData = JSON.parse(savedUser)
    if (userData.password !== password) {
      setErrors({ password: 'Senha incorreta' })
      return
    }

    setStep('entering')
    await new Promise(resolve => setTimeout(resolve, 4000))
    onLogin(userData)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: any = {}

    if (name.split(' ').length < 2) newErrors.name = 'Digite nome e sobrenome'
    if (!validatePhone(phone)) newErrors.phone = 'Número inválido'
    if (!province) newErrors.province = 'Selecione sua província'
    if (!birthDate) newErrors.birthDate = 'Informe sua data de nascimento'
    if (!dailyLimit) newErrors.dailyLimit = 'Selecione um limite'

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) newErrors.password = passwordValidation.message
    if (password !== confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setStep('creating')
    await new Promise(resolve => setTimeout(resolve, 12000)) // 12 segundos para parecer real

    const userData: UserData = {
      name: name.trim(),
      phone,
      password,
      province,
      birthDate,
      dailyLimit,
      balance: 0,
      income: 0,
      keys: initialKeys,
      transactions: initialTransactions
    }

    localStorage.setItem(`bankpix_user_${phone}`, JSON.stringify(userData))
    setStep('success')
  }

  if (step === 'creating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center">
        <div className="space-y-6">
          <div className="relative inline-block">
             <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
             <Wallet className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 animate-pulse">
            {creatingMessages[creatingMessageIndex]}
          </h2>
          <p className="text-gray-500">Estamos estabelecendo sua conexão segura...</p>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center animate-in fade-in duration-700">
        <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
        <h1 className="text-4xl font-black text-gray-900 mb-2">SUA CONTA ESTÁ ABERTA!</h1>
        <h2 className="text-2xl font-medium text-gray-700 mb-8">Bem-vindo, {name.split(' ')[0]}!</h2>
        <button
          onClick={() => onLogin(JSON.parse(localStorage.getItem(`bankpix_user_${phone}`)!))}
          className="w-full max-w-xs py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-transform"
        >
          ACESSAR MEU PIX AGORA
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-primary/10 rounded-2xl mb-4">
            <Wallet className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 italic">Bank<span className="text-primary">Pix</span></h1>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome Completo</label>
                <div className="relative mt-1">
                  <User className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: Elias Obitor" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Data de Nascimento</label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                    <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Província</label>
                  <select value={province} onChange={e => setProvince(e.target.value)} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
                    <option value="">Onde mora?</option>
                    <option value="Zambézia">Zambézia</option>
                    <option value="Maputo">Maputo</option>
                    <option value="Sofala">Sofala</option>
                    <option value="Nampula">Nampula</option>
                    {/* Outras províncias aqui */}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Limite de Movimentação Diária</label>
                <div className="relative mt-1">
                  <BarChart3 className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                  <select value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                    <option value="">Escolha seu limite</option>
                    <option value="1000">Até 1.000 MT / Dia</option>
                    <option value="5000">1.000 a 5.000 MT / Dia</option>
                    <option value="10000">Mais de 5.000 MT / Dia</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Número de Telefone</label>
            <div className="relative mt-1">
              <Phone className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
              <input type="tel" value={phone} onChange={handlePhoneChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="84XXXXXXX" maxLength={9} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Senha</label>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="••••••••" />
              </div>
            </div>
            {mode === 'register' && (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirmar Senha</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                  <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="••••••••" />
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-primary/30 transition-all mt-4 flex items-center justify-center gap-2">
            {mode === 'login' ? 'ENTRAR NA CONTA' : 'FINALIZAR CADASTRO'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">
            {mode === 'login' ? 'Não tem conta? Abra agora!' : 'Já é cliente? Faça Login'}
          </button>
        </div>
      </div>
    </div>
  )
}
