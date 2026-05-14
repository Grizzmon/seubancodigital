'use client'

import { Eye, EyeOff, TrendingUp, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, Banknote, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { formatBRL, formatMZN, convertToMZN, type PixKey, type Transaction } from '@/lib/store'

// PIX Symbol Component
function PixSymbol({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="currentColor">
      <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.9 231.1 518.9 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C257.1 224.3 247.8 224.3 242.4 218.9L165.7 142.2C151.5 128 132.6 120.2 112.6 120.2H103.3L200.4 23.11C230.7-7.229 279.9-7.229 310.2 23.11L407.7 120.6H392.6C372.6 120.6 353.7 128.4 339.5 142.6L262.5 218.9zM112.6 142.7C126.4 142.7 139.1 148.3 149.7 158.1L226.4 234.8C233.6 242 243.2 246.3 253.2 246.3C263.2 246.3 272.8 242 280 234.8L356.7 158.1C367.3 147.5 380 141.9 393.8 141.9H430.3L488.6 200.3C518.9 230.6 518.9 279.8 488.6 310.1L430.3 368.4H393.8C380 368.4 367.3 362.8 356.7 352.2L280 275.5C272.8 268.3 263.2 264 253.2 264C243.2 264 233.6 268.3 226.4 275.5L149.7 352.2C139.1 362.8 126.4 368.4 112.6 368.4H77.8L23.11 310.1C-7.229 279.8-7.229 230.6 23.11 200.3L77.8 142.7H112.6z"/>
    </svg>
  )
}

interface DashboardViewProps {
  userName: string
  balance: number
  income?: number
  keys: PixKey[]
  transactions: Transaction[]
  onNavigate: (view: 'create-key' | 'my-keys' | 'withdrawal') => void
}

export function DashboardView({ userName, balance, income = 0, keys, transactions, onNavigate }: DashboardViewProps) {
  const [showBalance, setShowBalance] = useState(true)
  const firstName = userName.split(' ')[0]
  const mznBalance = convertToMZN(balance)

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((acc, t) => acc + t.amount, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Ola, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao seu painel financeiro
        </p>
      </div>

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-card border border-primary/20 p-6 md:p-8">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo disponivel</p>
                <p className="text-xs text-muted-foreground/70">Conta principal</p>
              </div>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 rounded-lg bg-card/50 hover:bg-card transition-colors"
              aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            >
              {showBalance ? (
                <Eye className="w-5 h-5 text-muted-foreground" />
              ) : (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>

          <div className="space-y-4">
            {/* BRL Balance */}
            <div>
              <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                {showBalance ? formatBRL(balance) : 'R$ ******'}
              </p>
            </div>

            {/* MZN Conversion */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm">
                Equivale a{' '}
                <span className="font-semibold text-foreground">
                  {showBalance ? formatMZN(mznBalance) : 'MZN ******'}
                </span>
              </span>
            </div>

            {/* Exchange Rate */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Taxa de conversao: 1 BRL = 14 MZN
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PIX Area */}
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20">
            <PixSymbol className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Area PIX</h2>
            <p className="text-sm text-muted-foreground">Gerencie suas chaves</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('my-keys')}
            className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/50 transition-all duration-200"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium text-sm text-foreground">Minhas Chaves</span>
          </button>

          <button
            onClick={() => onNavigate('create-key')}
            className="flex items-center gap-3 p-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/25"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-foreground/20">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">Cadastrar Chave</span>
          </button>
        </div>
      </div>

      {/* Levantar Button */}
      <button
        onClick={() => onNavigate('withdrawal')}
        className="w-full flex items-center justify-center gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-200"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
          <Banknote className="w-6 h-6 text-primary" />
        </div>
        <div className="text-left">
          <span className="font-bold text-foreground block">Levantar</span>
          <span className="text-sm text-muted-foreground">M-Pesa ou e-Mola</span>
        </div>
      </button>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <ArrowDownLeft className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Entradas</span>
          </div>
          <p className="text-xl font-bold text-foreground">{showBalance ? formatBRL(income) : '****'}</p>
        </div>

        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
              <ArrowUpRight className="w-5 h-5 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Saidas</span>
          </div>
          <p className="text-xl font-bold text-foreground">{showBalance ? formatBRL(totalWithdrawals) : '****'}</p>
        </div>
      </div>

      {/* Extratos - Recent Transactions */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Extratos</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
              <ArrowDownLeft className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhuma transacao ainda</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Suas transacoes aparecerao aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((tx) => {
              const txDate = new Date(tx.date)
              const timeStr = txDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              
              return (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                      tx.type === 'income' ? 'bg-primary/10' : 'bg-destructive/10'
                    }`}>
                      {tx.type === 'income' ? (
                        <ArrowDownLeft className="w-5 h-5 text-primary" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {tx.type === 'income' 
                          ? (tx.senderName ? `Pix recebido de ${tx.senderName}` : 'Pix recebido')
                          : 'Levantamento'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.type === 'income' 
                          ? `no valor de ${formatBRL(tx.amount)}`
                          : (tx.method === 'mpesa' ? 'M-Pesa' : 'e-Mola')
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${tx.type === 'income' ? 'text-primary' : 'text-destructive'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatBRL(tx.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeStr}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
