'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Eye, EyeOff, Phone, User, Lock, CheckCircle, Wallet } from 'lucide-react'
import { LoadingSpinner } from './loading-spinner'
import { formatPhoneInput, validatePhone, validatePassword } from '@/lib/store'

interface UserData {
  name: string
  phone: string
  password: string
  balance: number
  income: number
  keys: any[]
  transactions: any[]
}

interface LoginScreenProps {
  onLogin: (userData: UserData) => void
}

const creatingMessages = [
  'Abrindo sua conta...',
  'Analisando as informacoes...',
  'Preparando sua conta...',
  'Finalizando o cadastro...',
  'Conectando ao Banco Central...'
]

// New accounts start with zero balance and no keys/transactions
const initialKeys: any[] = []
const initialTransactions: any[] = []

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; phone?: string; password?: string; confirmPassword?: string }>({})
  const [step, setStep] = useState<'form' | 'creating' | 'success' | 'entering'>('form')
  const [creatingMessageIndex, setCreatingMessageIndex] = useState(0)

  // Cycle through creating messages
  useEffect(() => {
    if (step === 'creating') {
      const interval = setInterval(() => {
        setCreatingMessageIndex(prev => (prev + 1) % creatingMessages.length)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [step])

  const validateName = (value: string): boolean => {
    const names = value.trim().split(/\s+/)
    return names.length >= 2 && names.every(n => n.length >= 2)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value)
    setPhone(formatted)
    setErrors(prev => ({ ...prev, phone: undefined }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { phone?: string; password?: string } = {}

    if (!phone.trim()) {
      newErrors.phone = 'Digite seu numero de telefone'
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Numero invalido'
    }

    if (!password.trim()) {
      newErrors.password = 'Digite sua senha'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Check saved user
    const savedUser = localStorage.getItem(`bankpix_user_${phone}`)
    if (!savedUser) {
      setErrors({ phone: 'Conta nao encontrada. Crie uma conta primeiro.' })
      return
    }

    const userData: UserData = JSON.parse(savedUser)
    if (userData.password !== password) {
      setErrors({ password: 'Senha incorreta' })
      return
    }

    setStep('entering')
    await new Promise(resolve => setTimeout(resolve, 6000))
    onLogin(userData)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { name?: string; phone?: string; password?: string; confirmPassword?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Digite seu nome completo'
    } else if (!validateName(name)) {
      newErrors.name = 'Digite pelo menos nome e sobrenome'
    }

    if (!phone.trim()) {
      newErrors.phone = 'Digite seu numero de telefone'
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Numero invalido (84, 85, 86 ou 87 + 7 digitos)'
    }

    // Check if user already exists
    const existingUser = localStorage.getItem(`bankpix_user_${phone}`)
    if (existingUser) {
      newErrors.phone = 'Este numero ja esta cadastrado. Faca login.'
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }
    }

    const passwordValidation = validatePassword(password)
    if (!password.trim()) {
      newErrors.password = 'Digite uma senha'
    } else if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirme sua senha'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas nao coincidem'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Start creating account - 10 seconds
    setStep('creating')
    setCreatingMessageIndex(0)

    await new Promise(resolve => setTimeout(resolve, 10000))

    // Create user data with zero balance
    const userData: UserData = {
      name: name.trim(),
      phone,
      password,
      balance: 0,
      income: 0,
      keys: initialKeys,
      transactions: initialTransactions
    }

    // Save to localStorage
    localStorage.setItem(`bankpix_user_${phone}`, JSON.stringify(userData))

    // Show success
    setStep('success')
  }

  const handleEnter = async () => {
    setStep('entering')
    
    await new Promise(resolve => setTimeout(resolve, 6000))
    
    const userData: UserData = {
      name: name.trim(),
      phone,
      password,
      balance: 0,
      income: 0,
      keys: initialKeys,
      transactions: initialTransactions
    }
    
    onLogin(userData)
  }

  if (step === 'creating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-6 animate-slide-up">
          <div className="relative">
            <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20">
              <Wallet className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -bottom-2 -right-2">
              <LoadingSpinner size="sm" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2 animate-pulse">
              {creatingMessages[creatingMessageIndex]}
            </h2>
            <p className="text-sm text-muted-foreground">Aguarde um momento</p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-6 animate-slide-up">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 animate-pulse-glow">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Conta aberta!</h2>
            <p className="text-sm text-muted-foreground mb-6">Sua conta foi criada com sucesso</p>
          </div>
          <button
            onClick={handleEnter}
            className="flex items-center justify-center gap-2 px-12 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/25"
          >
            Entrar
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  if (step === 'entering') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-6 animate-slide-up">
          <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20">
            <Wallet className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-foreground font-medium">Entrando no BankPix...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 mb-4">
            <Wallet className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">BankPix</h1>
          <p className="text-muted-foreground mt-2">Sua plataforma financeira digital</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-card-foreground mb-6 text-center">
            {mode === 'login' ? 'Fazer Login' : 'Criar sua conta'}
          </h2>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {/* Name Input - Only for register */}
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setErrors(prev => ({ ...prev, name: undefined }))
                    }}
                    placeholder="Digite seu nome completo"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-destructive animate-slide-up">{errors.name}</p>
                )}
              </div>
            )}

            {/* Phone Input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Numero de telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="849427717"
                  maxLength={9}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              {mode === 'register' && (
                <p className="mt-1 text-xs text-muted-foreground">84, 85, 86 ou 87 + 7 digitos</p>
              )}
              {errors.phone && (
                <p className="mt-1 text-sm text-destructive animate-slide-up">{errors.phone}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Senha {mode === 'register' && '(minimo 8 caracteres)'}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrors(prev => ({ ...prev, password: undefined }))
                  }}
                  placeholder="Digite sua senha"
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-destructive animate-slide-up">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password - Only for register */}
            {mode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setErrors(prev => ({ ...prev, confirmPassword: undefined }))
                    }}
                    placeholder="Confirme sua senha"
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-destructive animate-slide-up">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 shadow-lg shadow-primary/25 mt-6"
            >
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            {mode === 'login' ? (
              <p className="text-sm text-muted-foreground">
                Nao tem conta?{' '}
                <button
                  onClick={() => {
                    setMode('register')
                    setErrors({})
                    setPassword('')
                    setConfirmPassword('')
                  }}
                  className="text-primary font-semibold hover:underline"
                >
                  Criar conta
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ja tem conta?{' '}
                <button
                  onClick={() => {
                    setMode('login')
                    setErrors({})
                    setPassword('')
                    setConfirmPassword('')
                  }}
                  className="text-primary font-semibold hover:underline"
                >
                  Fazer login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
