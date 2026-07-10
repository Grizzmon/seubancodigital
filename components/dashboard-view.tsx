'use client'

import {
  Eye,
  EyeOff,
  Send,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Bell,
  Menu,
  X,
  Zap,
  Smartphone,
  FileText,
  Banknote,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { Receipt } from 'lucide-react'
import { formatBRL, formatMZN, convertToMZN, type PixKey, type Transaction } from '@/lib/store'

// PIX Symbol Premium
function PixSymbol({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="currentColor">
      <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.9 231.1 518.9 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C257.1 224.3 247.8 224.3 242.4 218.9L165.7 142.2C151.5 128 132.6 120.2 112.6 120.2H103.3L200.4 23.11C230.7-7.229 279.9-7.229 310.2 23.11L407.7 120.6H392.6C372.6 120.6 353.7 128.4 339.5 142.6L262.5 218.9zM112.6 142.7C126.4 142.7 139.1 148.3 149.7 158.1L226.4 234.8C233.6 242 243.2 246.3 253.2 246.3C263.2 246.3 272.8 242 280 234.8L356.7 158.1C367.3 147.5 380 141.9 393.8 141.9H430.3L488.6 200.3C518.9 230.6 518.9 279.8 488.6 310.1L430.3 368.4H393.8C380 368.4 367.3 362.8 356.7 352.2L280 275.5C272.8 268.3 263.2 264 253.2 264C243.2 264 233.6 268.3 226.4 275.5L149.7 352.2C139.1 362.8 126.4 368.4 112.6 368.4H77.8L23.11 310.1C-7.229 279.8-7.229 230.6 23.11 200.3L77.8 142.7H112.6z" />
    </svg>
  )
}

// Service Button Premium
interface ServiceButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  gradient?: string
}

function ServiceButton({ icon, label, onClick, gradient = 'from-blue-600 to-blue-700' }: ServiceButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center justify-center p-5 rounded-3xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl`}
    >
      <div className={`bg-gradient-to-br ${gradient} p-4 rounded-2xl mb-3 text-white shadow-lg group-hover:shadow-xl transition-all`}>
        {icon}
      </div>
      <span className="text-xs font-semibold text-slate-700 text-center">{label}</span>
    </button>
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

export function DashboardView({
  userName,
  balance,
  income = 0,
  keys,
  transactions,
  onNavigate,
}: DashboardViewProps) {
  const [showBalance, setShowBalance] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const firstName = userName.split(' ')[0]
  const userInitial = firstName.charAt(0).toUpperCase()
  const mznBalance = convertToMZN(balance)

  const totalWithdrawals = transactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((acc, t) => acc + t.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/80 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {userInitial}
            </div>
            <div>
              <p className="text-white font-bold text-lg">{firstName}</p>
              <p className="text-xs text-slate-400">BankPix Premium</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 hidden sm:flex">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200">
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 md:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Balance Card - Premium Design */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white p-8 sm:p-12 shadow-2xl border border-blue-500/20 transition-all duration-500 hover:shadow-3xl hover:border-blue-400/40">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-30 group-hover:opacity-40 transition-opacity" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 opacity-20" />

            <div className="relative space-y-8">
              {/* Top Section */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-semibold tracking-widest uppercase mb-4">Saldo Disponível</p>
                  <p className="text-5xl sm:text-6xl font-bold tracking-tight">
                    {showBalance ? formatBRL(balance) : 'R$ ••••••'}
                  </p>
                </div>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Toggle balance visibility"
                >
                  {showBalance ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                </button>
              </div>

              {/* Currency Section */}
              <div className="space-y-4">
                <div className="h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-medium mb-2">Equivalente em Metical</p>
                    <p className="text-3xl font-bold">
                      {showBalance ? formatMZN(mznBalance) : 'MZN ••••••'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-xs font-medium mb-2">Taxa de Câmbio</p>
                    <p className="text-lg font-semibold">1 BRL = 14,00 MZN</p>
                  </div>
                </div>
              </div>

              {/* Bottom Status */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-blue-100 text-xs font-medium">Atualizado agora</span>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Operações Rápidas</h2>
              <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-2 rounded-full">5 Serviços</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              <button
                onClick={() => onNavigate('my-keys')}
                className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl mb-4 text-white shadow-lg group-hover:shadow-xl transition-all">
                  <PixSymbol className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold text-white text-center">PIX</span>
              </button>

              <button
                onClick={() => onNavigate('create-key')}
                className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl mb-4 text-white shadow-lg group-hover:shadow-xl transition-all">
                  <Plus className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold text-white text-center">Adicionar</span>
              </button>

              <button
                onClick={() => onNavigate('withdrawal')}
                className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-2xl mb-4 text-white shadow-lg group-hover:shadow-xl transition-all">
                  <Banknote className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold text-white text-center">Sacar</span>
              </button>

              <Link
                href="/comprovante"
                className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-2xl mb-4 text-white shadow-lg group-hover:shadow-xl transition-all">
                  <Receipt className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold text-white text-center">Comprovante</span>
              </Link>

              <button
                className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-5 rounded-2xl mb-4 text-white shadow-lg group-hover:shadow-xl transition-all">
                  <Send className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold text-white text-center">Enviar</span>
              </button>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Income Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border border-emerald-800/50 p-8 hover:border-emerald-700/80 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                    <ArrowDownLeft className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">Entradas</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {showBalance ? formatBRL(income) : '••••'}
                </p>
              </div>
            </div>

            {/* Withdrawals Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-900/40 to-rose-950/40 border border-rose-800/50 p-8 hover:border-rose-700/80 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">Saídas</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {showBalance ? formatBRL(totalWithdrawals) : '••••'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Statement */}
          <div className="rounded-3xl bg-slate-800/50 border border-slate-700 backdrop-blur-xl overflow-hidden">
            <div className="p-8 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <History className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Extrato Recente</h3>
                </div>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/20 px-4 py-2 rounded-lg">
                  Últimas {transactions.length > 30 ? 30 : transactions.length}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-400 text-sm">Nenhuma transação registrada</p>
                </div>
              ) : (
                transactions.slice(0, 30).map((tx) => {
                  const txDate = new Date(tx.date)
                  const timeStr = txDate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const isIncome = tx.type === 'income'

                  return (
                    <div
                      key={tx.id}
                      className="p-4 hover:bg-slate-700/30 transition-colors duration-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isIncome
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-6 h-6" />
                          ) : (
                            <ArrowUpRight className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {isIncome
                              ? `Pix recebido${tx.senderName ? ` de ${tx.senderName}` : ''}`
                              : `Levantamento${tx.method ? ` · ${tx.method === 'mpesa' ? 'M-Pesa' : 'e-Mola'}` : ''}`}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{timeStr}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                        {isIncome ? '+' : '-'}
                        {formatBRL(tx.amount)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
