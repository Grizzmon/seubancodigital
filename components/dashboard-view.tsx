'use client'

import {
  Eye,
  EyeOff,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Banknote,
  History,
  Smartphone,
  Send,
  Zap,
  FileText,
  Bell,
  Settings,
  AlertCircle,
} from 'lucide-react'
import { useState } from 'react'
import { formatBRL, formatMZN, convertToMZN, type PixKey, type Transaction } from '@/lib/store'

// PIX Symbol Component
function PixSymbol({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="currentColor">
      <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.9 231.1 518.9 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C257.1 224.3 247.8 224.3 242.4 218.9L165.7 142.2C151.5 128 132.6 120.2 112.6 120.2H103.3L200.4 23.11C230.7-7.229 279.9-7.229 310.2 23.11L407.7 120.6H392.6C372.6 120.6 353.7 128.4 339.5 142.6L262.5 218.9zM112.6 142.7C126.4 142.7 139.1 148.3 149.7 158.1L226.4 234.8C233.6 242 243.2 246.3 253.2 246.3C263.2 246.3 272.8 242 280 234.8L356.7 158.1C367.3 147.5 380 141.9 393.8 141.9H430.3L488.6 200.3C518.9 230.6 518.9 279.8 488.6 310.1L430.3 368.4H393.8C380 368.4 367.3 362.8 356.7 352.2L280 275.5C272.8 268.3 263.2 264 253.2 264C243.2 264 233.6 268.3 226.4 275.5L149.7 352.2C139.1 362.8 126.4 368.4 112.6 368.4H77.8L23.11 310.1C-7.229 279.8-7.229 230.6 23.11 200.3L77.8 142.7H112.6z" />
    </svg>
  )
}

// Activation Modal - Premium Design
function ActivationModal({
  onClose,
  onActivate,
}: {
  onClose: () => void
  onActivate: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[24px] overflow-hidden max-w-md w-full shadow-2xl animate-in scale-in-95 duration-300 border border-slate-100">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 px-6 py-12 flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-3">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Ative sua Conta</h2>
            <p className="text-sm text-white/90 text-center mt-2">Desbloqueie todos os recursos premium</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          {/* Features List */}
          <div className="space-y-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-[16px] p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <PixSymbol className="w-2.5 h-2.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Usar Chave PIX</p>
                <p className="text-xs text-slate-600">Receba transferências instantâneas</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Send className="w-2.5 h-2.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Enviar PIX</p>
                <p className="text-xs text-slate-600">Transações rápidas e seguras</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <TrendingUp className="w-2.5 h-2.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Converter para Metical</p>
                <p className="text-xs text-slate-600">M-Pesa, e-Mola e outras carteiras</p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-[12px] p-3.5">
            <p className="text-xs text-amber-900 font-medium leading-relaxed">
              <span className="font-bold block mb-1">Importante:</span>
              Assista o vídeo até o final para ativar permanentemente sua conta.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-[12px] border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 active:scale-95 transition-all duration-200"
            >
              Depois
            </button>
            <button
              onClick={onActivate}
              className="flex-1 px-4 py-3 rounded-[12px] bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-600/30"
            >
              Ver Vídeo
            </button>
          </div>
        </div>
      </div>
    </div>
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
  const [showActivationModal, setShowActivationModal] = useState(false)

  const rawFirstName = userName.split(' ')[0] || ''
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase()
  const userInitial = rawFirstName.charAt(0).toUpperCase()

  const mznBalance = convertToMZN(balance)

  const totalWithdrawals = transactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((acc, t) => acc + t.amount, 0)

  const handleLimitedFeature = () => {
    setShowActivationModal(true)
  }

  const handleActivate = () => {
    window.open('https://google.com', '_blank')
    setShowActivationModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg border-b border-blue-500/20">
        <div className="px-6 py-4 max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between">
            {/* Left Side - Avatar & Name */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center font-semibold text-white text-sm shadow-lg">
                {userInitial}
              </div>
              <div className="flex flex-col">
                <p className="text-white font-bold text-sm leading-tight">{firstName}</p>
                <p className="text-xs text-blue-100">BankPix</p>
              </div>
            </div>

            {/* Right Side - Icons */}
            <div className="flex items-center gap-1">
              <button className="p-2.5 rounded-lg hover:bg-white/15 text-white transition-colors duration-200">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2.5 rounded-lg hover:bg-white/15 text-white transition-colors duration-200">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="overflow-y-auto">
        <div className="px-6 py-8 max-w-3xl mx-auto w-full pb-32">
          <div className="space-y-8">
            {/* Balance Card - Premium */}
            <div className="group relative overflow-hidden rounded-[24px] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white p-8 shadow-2xl border border-blue-500/20 transition-all duration-300 hover:shadow-3xl">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-40" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative space-y-8">
                {/* Balance Section */}
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold tracking-widest text-blue-100 uppercase mb-2">Saldo Disponível</p>
                    <p className="text-4xl font-bold text-white tracking-tight">
                      {showBalance ? formatBRL(balance) : 'R$ ••••••'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-3 rounded-[12px] bg-white/15 hover:bg-white/25 border border-white/20 text-blue-100 hover:text-white transition-all duration-200 ml-4"
                    aria-label="Toggle balance visibility"
                  >
                    {showBalance ? (
                      <Eye size={20} />
                    ) : (
                      <EyeOff size={20} />
                    )}
                  </button>
                </div>

                {/* Currency Conversion */}
                <div className="bg-white/10 border border-white/20 rounded-[12px] p-4 backdrop-blur-sm">
                  <p className="text-xs text-blue-100 font-medium mb-2">Equivalente em Metical</p>
                  <p className="text-2xl font-bold text-white">
                    {showBalance ? formatMZN(mznBalance) : 'MZN ••••••'}
                  </p>
                </div>

                {/* Exchange Rate Footer */}
                <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-blue-100">
                  <span className="font-medium">Câmbio: 1 BRL = 14,00 MZN</span>
                  <span className="inline-block px-3 py-1.5 bg-white/20 rounded-[8px] font-semibold border border-white/30">
                    Seguro
                  </span>
                </div>
              </div>
            </div>

            {/* Operations Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Operações Rápidas</h3>
                <p className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">5 Serviços</p>
              </div>

              {/* Service Grid */}
              <div className="grid grid-cols-5 gap-3">
                {/* PIX - Available */}
                <button
                  onClick={() => onNavigate('my-keys')}
                  className="group flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-[18px] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 active:scale-95 shadow-sm"
                >
                  <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 mb-2.5 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white transition-all duration-300 shadow-sm">
                    <PixSymbol className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 text-center leading-tight group-hover:text-blue-600 transition-colors">PIX</span>
                </button>

                {/* RECARGA - Limited */}
                <button
                  onClick={handleLimitedFeature}
                  className="group relative flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-[18px] hover:shadow-md transition-all duration-300 active:scale-95 shadow-sm"
                >
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-md">
                    !
                  </span>
                  <div className="w-11 h-11 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5 group-hover:bg-slate-200 transition-colors duration-300 shadow-sm">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 text-center leading-tight">Recarga</span>
                </button>

                {/* ENVIAR - Limited */}
                <button
                  onClick={handleLimitedFeature}
                  className="group relative flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-[18px] hover:shadow-md transition-all duration-300 active:scale-95 shadow-sm"
                >
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-md">
                    !
                  </span>
                  <div className="w-11 h-11 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5 group-hover:bg-slate-200 transition-colors duration-300 shadow-sm">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 text-center leading-tight">Enviar</span>
                </button>

                {/* BOLETO - Limited */}
                <button
                  onClick={handleLimitedFeature}
                  className="group relative flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-[18px] hover:shadow-md transition-all duration-300 active:scale-95 shadow-sm"
                >
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-md">
                    !
                  </span>
                  <div className="w-11 h-11 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5 group-hover:bg-slate-200 transition-colors duration-300 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 text-center leading-tight">Boleto</span>
                </button>

                {/* ENERGIA - Limited */}
                <button
                  onClick={handleLimitedFeature}
                  className="group relative flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 rounded-[18px] hover:shadow-md transition-all duration-300 active:scale-95 shadow-sm"
                >
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-md">
                    !
                  </span>
                  <div className="w-11 h-11 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5 group-hover:bg-slate-200 transition-colors duration-300 shadow-sm">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 text-center leading-tight">Energia</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('create-key')}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-[16px] transition-all duration-300 text-sm font-semibold shadow-lg shadow-blue-600/30 active:scale-95 border border-blue-500/20"
              >
                <Plus className="w-5 h-5" />
                <span>Cadastrar Chave PIX</span>
              </button>

              <button
                onClick={() => onNavigate('withdrawal')}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-[16px] hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 text-sm font-semibold shadow-sm active:scale-95"
              >
                <Banknote className="w-5 h-5" />
                <span>Levantar para M-Pesa / e-Mola</span>
              </button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-[16px] p-5 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">Entradas</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{showBalance ? formatBRL(income) : '••••'}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-[16px] p-5 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-rose-100 to-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">Saídas</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{showBalance ? formatBRL(totalWithdrawals) : '••••'}</p>
              </div>
            </div>

            {/* Recent Statement */}
            <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-5 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <History className="w-5 h-5 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900">Extrato Recente</h3>
                </div>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-[8px] uppercase border border-blue-200">
                  Atualizado
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-[14px] bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
                      <ArrowDownLeft className="w-6 h-6 text-slate-300" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Nenhuma movimentação</p>
                    <p className="text-xs text-slate-500 mt-1">Suas transações aparecerão aqui</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 divide-y divide-slate-100">
                  {transactions.slice(0, 8).map((tx, idx) => {
                    const txDate = new Date(tx.date)
                    const timeStr = txDate.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    const isIncome = tx.type === 'income'

                    return (
                      <div key={tx.id} className={`flex items-center justify-between ${idx === 0 ? '' : 'pt-3'}`}>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-[12px] flex items-center justify-center border shadow-sm ${
                              isIncome
                                ? 'bg-blue-50 border-blue-200 text-blue-600'
                                : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft className="w-5 h-5" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {isIncome ? 'Recebimento' : 'Levantamento'}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{timeStr}</p>
                          </div>
                        </div>

                        <p className={`text-sm font-bold ${isIncome ? 'text-blue-600' : 'text-slate-900'}`}>
                          {isIncome ? '+' : '-'}
                          {formatBRL(tx.amount)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activation Modal */}
      {showActivationModal && (
        <ActivationModal
          onClose={() => setShowActivationModal(false)}
          onActivate={handleActivate}
        />
      )}
    </div>
  )
}
