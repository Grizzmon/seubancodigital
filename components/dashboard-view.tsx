'use client'

import { Eye, EyeOff, TrendingUp, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, Banknote, KeyRound, ArrowRight, History, ShieldCheck, Smartphone, Send } from 'lucide-react'
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

// Modal de Limitação
function LimitationModal({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end z-50 animate-in fade-in duration-200">
      <div className="w-full bg-white rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300 max-w-md mx-auto shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Recurso Limitado</h2>
            <p className="text-sm text-slate-500 mt-1">Desbloqueie acesso completo</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-5 mb-6 border border-blue-100">
          <p className="text-slate-700 font-medium leading-relaxed">
            Você precisa aumentar o limite da sua conta para desbloquear todas as funções e aproveitar ao máximo a plataforma.
          </p>
        </div>

        {/* Benefícios */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">✓</div>
            <span className="text-sm text-slate-700 font-medium">Limite de transações ilimitadas</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">✓</div>
            <span className="text-sm text-slate-700 font-medium">Acesso a todas as funcionalidades</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">✓</div>
            <span className="text-sm text-slate-700 font-medium">Suporte prioritário 24/7</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Depois
          </button>
          <button
            onClick={onUnlock}
            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            Desbloquear AGORA!
          </button>
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

export function DashboardView({ userName, balance, income = 0, keys, transactions, onNavigate }: DashboardViewProps) {
  const [showBalance, setShowBalance] = useState(true)
  const [showLimitModal, setShowLimitModal] = useState(false)

  const rawFirstName = userName.split(' ')[0] || ''
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase()

  const mznBalance = convertToMZN(balance)

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((acc, t) => acc + t.amount, 0)

  const handleLimitedFeature = () => {
    setShowLimitModal(true)
  }

  const handleUnlock = () => {
    window.open('https://google.com', '_blank')
    setShowLimitModal(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 antialiased pb-12 text-slate-900">
      
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Olá, {firstName}
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5 tracking-wide">
            Bem-vindo ao seu painel BankPix
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100/50 px-2.5 py-1.5 rounded-xl">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[10px] font-bold text-blue-700 tracking-wider uppercase">Seguro</span>
        </div>
      </div>

      {/* CARD SALDO ESTILO NUBANK - AZUL GRADIENTE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 to-blue-900 text-white p-8 shadow-2xl border border-blue-600/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-24 translate-x-24" />
        
        <div className="relative space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-blue-100 uppercase">Saldo Disponível</span>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white transition-all border border-white/10"
              aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            >
              {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-5xl font-bold tracking-tight text-white transition-all">
              {showBalance ? formatBRL(balance) : 'R$ ••••••'}
            </p>
            <div className="flex items-center gap-2 text-blue-100 font-medium">
              <TrendingUp className="w-4 h-4" />
              <p className="text-sm">
                Equivale a <span className="font-bold text-white">{showBalance ? formatMZN(mznBalance) : 'MZN ••••••'}</span>
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-100">
            <span className="font-medium">Câmbio Comercial</span>
            <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg text-white font-semibold">1 BRL = 14,00 MZN</span>
          </div>
        </div>
      </div>

      {/* AÇÕES RÁPIDAS - 3 BOTÕES ARREDONDADOS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Ações Rápidas</h3>
        
        <div className="grid grid-cols-3 gap-3">
          {/* PIX - FUNCIONAL */}
          <button
            onClick={() => onNavigate('my-keys')}
            className="group flex flex-col items-center justify-center p-5 bg-white border-2 border-transparent rounded-3xl hover:border-blue-500 hover:shadow-lg transition-all hover:bg-blue-50/30 text-center space-y-3 shadow-md hover:scale-105 active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover:shadow-blue-600/50 transition-all">
              <PixSymbol className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-800 tracking-tight block">Minha Área</span>
              <span className="text-[9px] text-slate-500 font-medium">PIX</span>
            </div>
          </button>

          {/* PAGAR - LIMITADO */}
          <button
            onClick={handleLimitedFeature}
            className="group relative flex flex-col items-center justify-center p-5 bg-white border-2 border-slate-200 rounded-3xl hover:border-slate-300 transition-all hover:bg-slate-50/50 text-center space-y-3 shadow-md active:scale-95"
          >
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              Limitado
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Send className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-800 tracking-tight block">Pagar</span>
              <span className="text-[9px] text-slate-500 font-medium">Pessoas</span>
            </div>
          </button>

          {/* RECARREGAR - LIMITADO */}
          <button
            onClick={handleLimitedFeature}
            className="group relative flex flex-col items-center justify-center p-5 bg-white border-2 border-slate-200 rounded-3xl hover:border-slate-300 transition-all hover:bg-slate-50/50 text-center space-y-3 shadow-md active:scale-95"
          >
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              Limitado
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-800 tracking-tight block">Recarregar</span>
              <span className="text-[9px] text-slate-500 font-medium">Celular</span>
            </div>
          </button>
        </div>

        {/* Botão Cadastrar Nova Chave PIX */}
        <button
          onClick={() => onNavigate('create-key')}
          className="w-full flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all text-center shadow-lg shadow-blue-600/20 active:scale-[0.98] font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Cadastrar Nova Chave PIX</span>
        </button>

        {/* Botão Levantar Fundos */}
        <button
          onClick={() => onNavigate('withdrawal')}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white border-2 border-slate-200 text-slate-800 rounded-2xl hover:border-blue-500 hover:bg-blue-50/20 transition-all text-center shadow-sm active:scale-[0.98] font-semibold"
        >
          <Banknote className="w-5 h-5" />
          <span>Levantar para M-Pesa / e-Mola</span>
        </button>
      </div>

      {/* BALANÇOS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Entradas</span>
            <p className="text-base font-bold text-slate-800">{showBalance ? formatBRL(income) : '••••'}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Saídas</span>
            <p className="text-base font-bold text-slate-800">{showBalance ? formatBRL(totalWithdrawals) : '••••'}</p>
          </div>
        </div>
      </div>

      {/* EXTRATO */}
      <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800">Extrato Recente</h3>
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">Atualizado</span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 mx-auto">
              <ArrowDownLeft className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Nenhuma movimentação</p>
            <p className="text-[12px] text-slate-400 font-light">Seus envios e recebimentos Pix surgirão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3 divide-y divide-slate-50">
            {transactions.slice(0, 10).map((tx, idx) => {
              const txDate = new Date(tx.date)
              const timeStr = txDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              const isIncome = tx.type === 'income'
              
              return (
                <div key={tx.id} className={`flex items-center justify-between pt-3 ${idx === 0 ? 'pt-0' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${
                      isIncome 
                        ? 'bg-blue-50/70 border-blue-100 text-blue-600' 
                        : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}>
                      {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">
                        {isIncome 
                          ? (tx.senderName ? `Recebido de ${tx.senderName.charAt(0).toUpperCase() + tx.senderName.slice(1).toLowerCase()}` : 'Pix Recebido')
                          : 'Levantamento efetuado'
                        }
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {isIncome 
                          ? `Crédito em carteira`
                          : (tx.method === 'mpesa' ? 'Via Carteira M-Pesa' : 'Via Carteira e-Mola')
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-bold text-xs ${isIncome ? 'text-blue-600' : 'text-slate-700'}`}>
                      {isIncome ? '+' : '-'}{formatBRL(tx.amount)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-light mt-0.5">{timeStr}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Limitação */}
      {showLimitModal && (
        <LimitationModal
          onClose={() => setShowLimitModal(false)}
          onUnlock={handleUnlock}
        />
      )}
    </div>
  )
}
