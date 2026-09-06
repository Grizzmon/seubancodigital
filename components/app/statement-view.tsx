'use client'

import { ChevronLeft, ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react'
import { formatBRL, formatMZN, type Transaction } from '@/lib/store'

const METHOD_LABEL: Record<Transaction['method'], string> = {
  mpesa: 'M-Pesa',
  emola: 'e-Mola',
  mkesh: 'mKesh',
  transfer: 'Pix recebido',
}

export function StatementView({ balance, transactions, onBack }: { balance: number; transactions: Transaction[]; onBack: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background animate-step-forward">
      <header className="bg-brand-gradient px-6 pb-10 pt-4 text-primary-foreground">
        <div className="flex h-12 items-center">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-background/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>
        <h1 className="pt-4 text-2xl font-bold">Extrato</h1>
        <p className="text-sm text-primary-foreground/80">Saldo atual: {formatBRL(balance)}</p>
      </header>

      <main className="-mt-5 flex flex-1 flex-col gap-4 rounded-t-3xl bg-background px-6 pt-8 pb-10">
        {transactions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-primary">
              <Receipt className="h-9 w-9" />
            </span>
            <h2 className="text-xl font-bold">Sem movimentações</h2>
            <p className="text-pretty text-muted-foreground">Suas entradas e levantamentos vão aparecer aqui.</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {transactions.map((t) => {
              const incoming = t.type === 'income'
              return (
                <li key={t.id} className="flex items-center gap-4 py-4">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${incoming ? 'bg-success/15 text-success' : 'bg-accent text-primary'}`}>
                    {incoming ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{incoming ? t.senderName || 'Pix recebido' : `Levantamento ${METHOD_LABEL[t.method]}`}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className={`font-semibold tabular-nums ${incoming ? 'text-success' : 'text-foreground'}`}>
                      {incoming ? '+' : '-'}{formatBRL(t.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatMZN(t.amountMZN)}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
