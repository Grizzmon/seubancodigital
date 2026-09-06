'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { AuthFlow } from '@/components/onboarding/auth-flow'
import { loadStoredUser, saveStoredUser, type StoredUser } from '@/lib/stored-user'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardView } from '@/components/dashboard-view'
import { CreateKeyView } from '@/components/create-key-view'
import { MyKeysView } from '@/components/my-keys-view'
import { WithdrawalView } from '@/components/withdrawal-view'
import { AccountMenu } from '@/components/account-menu'
import { type PixKey, type Transaction } from '@/lib/store'


type View = 'dashboard' | 'create-key' | 'my-keys' | 'withdrawal'

type UserData = StoredUser

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

    // Mantém os dados do perfil (senhas, documento, carteiras) e atualiza só o que muda no app.
    const existing = loadStoredUser(userPhone)
    saveStoredUser({
      ...(existing ?? { password: '' }),
      name: userName,
      phone: userPhone,
      balance,
      income,
      keys,
      transactions,
    })
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
    return <AuthFlow onLogin={handleLogin} />
  }

  // A área interna ainda usa o tema escuro anterior; será redesenhada na próxima fase.
  return (
    <div className="dark flex min-h-screen flex-col bg-gray-950 text-white lg:flex-row">
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
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <MainApp {...props} />
    </Suspense>
  )
}
