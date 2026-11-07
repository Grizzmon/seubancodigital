'use client'

import { useCallback, useState } from 'react'
import { HomeView } from '@/components/app/home-view'
import { PixAreaView } from '@/components/app/pix-area-view'
import { PixKeyFlow } from '@/components/app/pix-key-flow'
import { WithdrawFlow } from '@/components/app/withdraw-flow'
import { StatementView } from '@/components/app/statement-view'
import { ProIntro } from '@/components/app/pro-intro'
import { convertToMZN, type PixKey, type Transaction } from '@/lib/store'

type View = 'home' | 'pix' | 'create-key' | 'withdraw' | 'statement' | 'pro-intro'

const INITIAL_USER_NAME = 'Usuário'
const INITIAL_BALANCE = 719

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', type: 'income', amount: 50, amountMZN: convertToMZN(50), method: 'transfer', date: new Date(Date.now() - 1000 * 60 * 60 * 5), status: 'completed', senderName: 'José Carlos' },
  { id: 'tx-2', type: 'income', amount: 90, amountMZN: convertToMZN(90), method: 'transfer', date: new Date(Date.now() - 1000 * 60 * 60 * 26), status: 'completed', senderName: 'Mendes Luís Carlos' },
  { id: 'tx-3', type: 'income', amount: 579, amountMZN: convertToMZN(579), method: 'transfer', date: new Date(Date.now() - 1000 * 60 * 60 * 50), status: 'completed', senderName: 'Transferência de entrada' },
]

export default function DemoTeste09Page() {
  const [balance, setBalance] = useState(INITIAL_BALANCE)
  const [keys, setKeys] = useState<PixKey[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS)
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
    setBalance(INITIAL_BALANCE)
    setKeys([])
    setTransactions(INITIAL_TRANSACTIONS)
    setCurrentView('home')
  }, [])

  const openPro = (from: View) => {
    setProReturnView(from)
    setCurrentView('pro-intro')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background text-foreground">
      {currentView === 'home' && (
        <HomeView
          userName={INITIAL_USER_NAME}
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
          userName={INITIAL_USER_NAME}
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
