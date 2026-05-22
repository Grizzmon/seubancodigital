'use client'

import { useState, useCallback, useEffect } from 'react'
import { LoginScreen } from '@/components/login-screen'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardView } from '@/components/dashboard-view'
import { CreateKeyView } from '@/components/create-key-view'
import { MyKeysView } from '@/components/my-keys-view'
import { WithdrawalView } from '@/components/withdrawal-view'
import { AccountMenu } from '@/components/account-menu'
import { InactiveAccountBar } from '@/components/inactive-account-bar'
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

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [balance, setBalance] = useState(0)
  const [income, setIncome] = useState(0)
  const [keys, setKeys] = useState<PixKey[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    if (isLoggedIn && userPhone) {
      const userData: UserData = {
        name: userName,
        phone: userPhone,
        password: '', // Don't overwrite password
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
  }, [])

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
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Barra de conta inativa no topo */}
      <InactiveAccountBar />

      {/* Account Menu Modal */}
      <AccountMenu
        isOpen={showAccountMenu}
        onClose={() => setShowAccountMenu(false)}
        userName={userName}
        userPhone={userPhone}
      />

      <AppSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        userName={userName}
        userPhone={userPhone}
        onLogout={handleLogout}
        onOpenAccountMenu={() => setShowAccountMenu(true)}
      />

      <main className="lg:pl-64 min-h-screen pt-24 lg:pt-16">
        <div className="p-4 md:p-6 lg:p-8">
          {currentView === 'dashboard' && (
            <DashboardView
              userName={userName}
              balance={balance}
              income={income}
              keys={keys}
              transactions={transactions}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'create-key' && (
            <CreateKeyView
              userName={userName}
              onAddKey={handleAddKey}
              onBack={() => setCurrentView('dashboard')}
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
