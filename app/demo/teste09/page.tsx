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

const DEMO_USER_NAME = 'Usuário'
const DEMO_BALANCE = 719

// Dados exclusivamente fictícios para a cena de demonstração.
const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 'demo-1', type: 'income', amount: 50, amountMZN: convertToMZN(50), method: 'transfer', date: new Date(Date.now() - 1000 * 60 * 60 * 5), status: 'completed', senderName: 'José Carlos' },
  { id: 'demo-2', type: 'income', amount: 90, amountMZN: convertToMZN(90), method: 'transfer', date: new Date(Date.now() - 1000 * 60 * 60 * 26), status: 'completed', senderName: 'Mendes Luís Carlos' },
  { id: 'demo-3', type: 'income', amount: 579, amountMZN: convertToMZN(579), method: 'transfer', date: new Date(Date.now() - 1000 * 60 * 60 * 50), status: 'completed', senderName: 'Transferência de entrada' },
]

export default function DemoTeste09Page() {
  const [hasAcknowledgedFiction, setHasAcknowledgedFiction] = useState(false)
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

  if (!hasAcknowledgedFiction) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center bg-background px-6 py-8 text-foreground">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm" aria-labelledby="fiction-notice-title">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Aviso importante</p>
          <h1 id="fiction-notice-title" className="text-balance text-2xl font-bold tracking-tight">
            Esta experiência é fictícia
          </h1>
          <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">
            Esta tela foi criada exclusivamente para um filme e não representa uma conta bancária real. O saldo, o extrato e as chaves são dados inventados e nenhuma operação funciona de verdade.
          </p>
          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => setHasAcknowledgedFiction(true)}
          >
            Estou ciente e entrar
          </button>
        </section>
      </main>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background text-foreground">
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
