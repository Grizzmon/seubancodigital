'use client'

import { useCallback, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { HomeView } from '@/components/app/home-view'
import { PixAreaView } from '@/components/app/pix-area-view'
import { PixKeyFlow } from '@/components/app/pix-key-flow'
import { WithdrawFlow } from '@/components/app/withdraw-flow'
import { StatementView } from '@/components/app/statement-view'
import { ProIntro } from '@/components/app/pro-intro'
import { convertToMZN, type PixKey, type Transaction } from '@/lib/store'

type View = 'home' | 'pix' | 'create-key' | 'withdraw' | 'statement' | 'pro-intro'

const DEMO_USER_NAME = 'Usuário Demo'
const DEMO_BALANCE = 133.38

// Entradas fictícias que somam exatamente o saldo de demonstração.
const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 'demo-1', type: 'income', amount: 48.9, amountMZN: convertToMZN(48.9), method: 'transfer', date: new Date(Date.now() - 1000 * 60 * 60 * 5), status: 'completed', senderName: 'Pix recebido (demo)' },
  { id: 'demo-2', type: 'income', amount: 35.0, amountMZN: convertToMZN(35.0), method: 'transfer', date: new Date(Date.now() - 1000 * 60 * 60 * 26), status: 'completed', senderName: 'Pix recebido (demo)' },
  { id: 'demo-3', type: 'income', amount: 49.48, amountMZN: convertToMZN(49.48), method: 'transfer', date: new Date(Date.now() - 1000 * 60 * 60 * 50), status: 'completed', senderName: 'Pix recebido (demo)' },
]

export default function DemoTeste09Page() {
  const [balance, setBalance] = useState(DEMO_BALANCE)
  const [keys, setKeys] = useState<PixKey[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS)
  const [currentView, setCurrentView] = useState<View>('home')
  const [proReturnView, setProReturnView] = useState<View>('home')

  const handleAddKey = useCallback((key: PixKey) => {
    setKeys((previousKeys) => [key, ...previousKeys])
  }, [])

  const handleWithdrawal = useCallback((transaction: Transaction) => {
    setBalance((currentBalance) => currentBalance - transaction.amount)
    setTransactions((previousTransactions) => [transaction, ...previousTransactions])
  }, [])

  const handleReset = useCallback(() => {
    setBalance(DEMO_BALANCE)
    setKeys([])
    setTransactions(DEMO_TRANSACTIONS)
    setCurrentView('home')
  }, [])

  const openPro = (from: View) => {
    setProReturnView(from)
    setCurrentView('pro-intro')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background text-foreground">
      <div
        role="status"
        className="sticky top-0 z-50 flex items-center gap-2 bg-warning px-4 py-2 text-xs font-semibold text-background"
      >
        <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex-1 text-pretty">Ambiente de demonstração — dados fictícios, sem valor real.</span>
      </div>

      {currentView === 'home' && (
        <HomeView
          userName={DEMO_USER_NAME}
          balance={balance}
          isPro
          hasTransactions={transactions.length > 0}
          onOpenPix={() => setCurrentView('pix')}
          onOpenWithdraw={() => setCurrentView('withdraw')}
          onOpenStatement={() => setCurrentView('statement')}
          onOpenPro={() => openPro('home')}
          onLogout={handleReset}
        />
      )}

      {currentView === 'pix' && (
        <PixAreaView
          keys={keys}
          isPro
          onBack={() => setCurrentView('home')}
          onCreateKey={() => setCurrentView('create-key')}
          onWithdraw={() => setCurrentView('withdraw')}
          onOpenPro={() => openPro('pix')}
        />
      )}

      {currentView === 'create-key' && (
        <PixKeyFlow
          userName={DEMO_USER_NAME}
          isPro
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
