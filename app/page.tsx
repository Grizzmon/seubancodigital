'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
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
      // O usuário já foi criado/recuperado e vinculado ao push pela LoginScreen
      // (lib/register-user.ts); nada mais a persistir aqui.
    },
    [],
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
