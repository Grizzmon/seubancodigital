'use client'

import { useState } from 'react'
import { WelcomeScreen } from './welcome-screen'
import { LoginScreen } from './login-screen'
import { SignupFlow } from './signup-flow'
import type { StoredUser } from '@/lib/stored-user'

type Mode = 'welcome' | 'login' | 'signup'

// Porta de entrada do app: boas-vindas, login ou cadastro passo a passo.
export function AuthFlow({ onLogin }: { onLogin: (user: StoredUser) => void }) {
  const [mode, setMode] = useState<Mode>('welcome')

  if (mode === 'login') {
    return (
      <LoginScreen
        onBack={() => setMode('welcome')}
        onCreateAccount={() => setMode('signup')}
        onLogin={onLogin}
      />
    )
  }

  if (mode === 'signup') {
    return <SignupFlow onExit={() => setMode('welcome')} onComplete={onLogin} />
  }

  return <WelcomeScreen onStart={() => setMode('signup')} onLogin={() => setMode('login')} />
}
