'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { AuthFlow } from '@/components/onboarding/auth-flow'
import { loadStoredUser, saveStoredUser, type StoredUser } from '@/lib/stored-user'
import { HomeView } from '@/components/app/home-view'
import { PixAreaView } from '@/components/app/pix-area-view'
import { PixKeyFlow } from '@/components/app/pix-key-flow'
import { WithdrawFlow } from '@/components/app/withdraw-flow'
import { StatementView } from '@/components/app/statement-view'
import { ProIntro } from '@/components/app/pro-intro'
import { ProWelcome } from '@/components/app/pro-welcome'
import { consumeProWelcome, getPlan } from '@/lib/pro'
import { type PixKey, type Transaction } from '@/lib/store'

type View = 'home' | 'pix' | 'create-key' | 'withdraw' | 'statement' | 'pro-intro' | 'pro-welcome'

// Guarda quem está com sessão aberta para não pedir login a cada abertura do app.
const SESSION_KEY = 'realpayz_session_phone'

function MainApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [balance, setBalance] = useState(0)
  const [income, setIncome] = useState(0)
  const [keys, setKeys] = useState<PixKey[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [profile, setProfile] = useState<StoredUser | null>(null)
  const [currentView, setCurrentView] = useState<View>('home')
  const [proReturnView, setProReturnView] = useState<View>('home')
  const [sessionChecked, setSessionChecked] = useState(false)
  const [isPro, setIsPro] = useState(false)

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

  const handleLogin = useCallback(async (userData: StoredUser) => {
    setUserName(userData.name)
    setUserPhone(userData.phone)
    setBalance(userData.balance)
    setIncome(userData.income)
    setKeys(userData.keys || [])
    setTransactions(userData.transactions || [])
    setProfile(loadStoredUser(userData.phone) ?? userData)
    const pro = getPlan() === 'pro'
    setIsPro(pro)
    // Quem chegou pelo link VIP vê as boas-vindas ao modo Pro uma única vez.
    setCurrentView(pro && consumeProWelcome() ? 'pro-welcome' : 'home')
    setIsLoggedIn(true)
    localStorage.setItem(SESSION_KEY, userData.phone)
  }, [])

  useEffect(() => {
    const sessionPhone = localStorage.getItem(SESSION_KEY)
    if (!sessionPhone) {
      setSessionChecked(true)
      return
    }
    const saved = loadStoredUser(sessionPhone)
    if (saved) handleLogin(saved)
    setSessionChecked(true)
  }, [handleLogin])

  const handleLogout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setIsLoggedIn(false)
    setUserName('')
    setUserPhone('')
    setProfile(null)
    setCurrentView('home')
    setKeys([])
    setTransactions([])
    setBalance(0)
    setIncome(0)
  }, [])

  const handleAddKey = useCallback((key: PixKey) => {
    setKeys((previousKeys) => [key, ...previousKeys])
  }, [])

  const handleWithdrawal = useCallback((transaction: Transaction) => {
    setBalance((currentBalance) => currentBalance - transaction.amount)
    setTransactions((previousTransactions) => [transaction, ...previousTransactions])
  }, [])

  if (!sessionChecked) {
    return <div className="min-h-dvh bg-background" aria-hidden="true" />
  }

  if (!isLoggedIn) {
    return <AuthFlow onLogin={handleLogin} />
  }

  // Guarda a tela de origem para voltar ao fechar a apresentação Pro.
  const openPro = (from: View) => {
    setProReturnView(from)
    setCurrentView('pro-intro')
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-background text-foreground">
      {currentView === 'pro-welcome' && <ProWelcome userName={userName} onContinue={() => setCurrentView('home')} />}

      {currentView === 'home' && (
        <HomeView
          userName={userName}
          balance={balance}
          isPro={isPro}
          hasTransactions={transactions.length > 0}
          onOpenPix={() => setCurrentView('pix')}
          onOpenWithdraw={() => setCurrentView('withdraw')}
          onOpenStatement={() => setCurrentView('statement')}
          onOpenPro={() => openPro('home')}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'pix' && (
        <PixAreaView
          keys={keys}
          isPro={isPro}
          onBack={() => setCurrentView('home')}
          onCreateKey={() => setCurrentView('create-key')}
          onWithdraw={() => setCurrentView('withdraw')}
          onOpenPro={() => openPro('pix')}
        />
      )}

      {currentView === 'create-key' && (
        <PixKeyFlow
          userName={userName}
          isPro={isPro}
          onAddKey={handleAddKey}
          onDone={() => setCurrentView('pix')}
          onCancel={() => setCurrentView('pix')}
          onOpenPro={() => openPro('pix')}
        />
      )}

      {currentView === 'pro-intro' && <ProIntro onClose={() => setCurrentView(proReturnView)} />}

      {currentView === 'withdraw' && (
        <WithdrawFlow
          balance={balance}
          transactionPin={profile?.transactionPin}
          onWithdrawal={handleWithdrawal}
          onDone={() => setCurrentView('home')}
          onGoToPix={() => setCurrentView('pix')}
          onCancel={() => setCurrentView('home')}
        />
      )}

      {currentView === 'statement' && (
        <StatementView balance={balance} transactions={transactions} onBack={() => setCurrentView('home')} />
      )}
    </div>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <MainApp />
    </Suspense>
  )
}
