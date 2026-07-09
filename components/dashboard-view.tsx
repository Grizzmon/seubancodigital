'use client'

import { Eye, EyeOff, TrendingUp, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, Banknote, KeyRound, ArrowRight, History, ShieldCheck, Smartphone, Send, Zap, FileText, User } from 'lucide-react'
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

// Modal de Ativação Centralizada
function ActivationModal({ onClose, onActivate }: { onClose: () => void; onActivate: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in scale-in duration-300">
        
        {/* Header Vermelho */}
        <div className="bg-red-500 px-6 py-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Conta Desativada</h2>
          <p className="text-white/90 text-sm mt-2">Ative sua conta agora</p>
        </div>

        {/* Body */}
        <div className="px-6 py-8 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
            <p className="text-red-900 font-bold text-sm">Para usar todas as funcionalidades, você precisa:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-3 text-sm text-red-800">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>Ver o vídeo de ativação até o final</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-red-800">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>Desbloquear PIX e todas as transferências</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-red-800">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>Converter saldo para Metical (M-Pesa e e-Mola)</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-red-800">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>Acessar todas as funcionalidades premium</span>
              </li>
            </ul>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all active:scale-95"
            >
              Depois
            </button>
            <button
              onClick={onActivate}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/30"
            >
              Ver Vídeo e Ativar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Icon para AlertCircle
function AlertCircle({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
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
  const [showActivationModal, setShowActivationModal] = useState(true)
  const [isActivated, setIsActivated] = useState(false)

  const rawFirstName = userName.split(' ')[0] || ''
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase()
  const userInitial = rawFirstName.charAt(0).toUpperCase()

  const mznBalance = convertToMZN(balance)

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((acc, t) => acc + t.amount, 0)

  const handleLimitedFeature = () => {
    if (!isActivated) {
      setShowActivationModal(true)
    }
  }

  const handleActivate = () => {
    window.open('https://google.com', '_blank')
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300 antialiased pb-20 text-slate-900">
      
      {/* BARRA AZUL NO TOPO - NOME DO USUÁRIO */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-700 to-blue-600 text-white px-4 py-5 rounded-b-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center font-bold text-lg">
              {userInitial}
            </div>
            <div>
              <p className="text-xs text-blue-100 font-medium">Bem-vindo,</p>
              <p className="text-lg font-bold text-white">{firstName}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            isActivated 
              ? 'bg-emerald-400/20 text-emerald-300' 
              : 'bg-red-400/20 text-red-300'
          }`}>
            {isActivated ? '✓ Ativa' : '! Inativa'}
          </div>
        </div>
      </div>

      {/* CARD SALDO - COMPACTO E PROFISSIONAL */}
      <div className="mx-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 text-white p-5 shadow-xl border border-blue-600/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-20 translate-x-20" />
        
        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-blue-100 uppercase">Saldo Disponível</span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-blue-100 transition-all"
              aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            >
              {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-4xl font-bold tracking-tight text-white">
              {showBalance ? formatBRL(balance) : 'R$ ••••••'}
            </p>
            <div className="flex items-center gap-2 text-blue-100 text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              <p>
                {showBalance ? formatMZN(mznBalance) : 'MZN ••••••'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MENU DE AÇÕES RÁPIDAS - 5 BOTÕES COMPACTOS */}
      <div className="mx-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Serviços</h3>
        
        <div className="grid grid-cols-5 gap-2">
          {/* PIX - FUNCIONAL */}
          <button
            onClick={() => onNavigate('my-keys')}
            className="flex flex-col items-center justify-center p-3 bg-white border-2 border-transparent rounded-2xl hover:border-blue-500 hover:shadow-md transition-all text-center space-y-2 shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <PixSymbol className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 leading-tight">PIX</span>
          </button>

          {/* RECARGA - LIMITADO */}
          <button
            onClick={handleLimitedFeature}
            className="group relative flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl hover:shadow-sm transition-all text-center space-y-2 shadow-sm"
          >
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 leading-tight">Recarga</span>
          </button>

          {/* ENVIAR - LIMITADO */}
          <button
            onClick={handleLimitedFeature}
            className="group relative flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl hover:shadow-sm transition-all text-center space-y-2 shadow-sm"
          >
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
              <Send className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 leading-tight">Enviar</span>
          </button>

          {/* BOLETO - LIMITADO */}
          <button
            onClick={handleLimitedFeature}
            className="group relative flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl hover:shadow-sm transition-all text-center space-y-2 shadow-sm"
          >
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 leading-tight">Boleto</span>
          </button>

          {/* ENERGIA - LIMITADO */}
          <button
            onClick={handleLimitedFeature}
            className="group relative flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl hover:shadow-sm transition-all text-center space-y-2 shadow-sm"
          >
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 leading-tight">Energia</span>
          </button>
        </div>
      </div>

      {/* AÇÕES SECUNDÁRIAS */}
      <div className="mx-4 space-y-2 flex flex-col gap-2">
        <button
          onClick={() => onNavigate('create-key')}
          className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm shadow-md font-semibold active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Chave PIX</span>
        </button>

        <button
          onClick={() => onNavigate('withdrawal')}
          className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 text-slate-800 rounded-xl hover:border-blue-500 hover:bg-blue-50/20 transition-all text-sm shadow-sm font-semibold active:scale-95"
        >
          <Banknote className="w-4 h-4" />
          <span>Levantar M-Pesa / e-Mola</span>
        </button>
      </div>

      {/* RESUMO FINANCEIRO - COMPACTO */}
      <div className="mx-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white border border-slate-100 p-3 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Entradas</span>
          </div>
          <p className="text-base font-bold text-slate-800">{showBalance ? formatBRL(income) : '••••'}</p>
        </div>

        <div className="rounded-xl bg-white border border-slate-100 p-3 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Saídas</span>
          </div>
          <p className="text-base font-bold text-slate-800">{showBalance ? formatBRL(totalWithdrawals) : '••••'}</p>
        </div>
      </div>

      {/* EXTRATO RECENTE */}
      <div className="mx-4 rounded-2xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Extrato</h3>
          </div>
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg uppercase">Recente</span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 mx-auto">
              <ArrowDownLeft className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-xs font-semibold text-slate-700">Nenhuma movimentação</p>
            <p className="text-[11px] text-slate-400">Suas transações aparecem aqui</p>
          </div>
        ) : (
          <div className="space-y-2 divide-y divide-slate-50">
            {transactions.slice(0, 8).map((tx, idx) => {
              const txDate = new Date(tx.date)
              const timeStr = txDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              const isIncome = tx.type === 'income'
              
              return (
                <div key={tx.id} className={`flex items-center justify-between pt-2 ${idx === 0 ? 'pt-0' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg border ${
                      isIncome 
                        ? 'bg-blue-50/70 border-blue-100 text-blue-600' 
                        : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}>
                      {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">
                        {isIncome 
                          ? (tx.senderName ? `Recebido de ${tx.senderName.split(' ')[0]}` : 'Pix Recebido')
                          : 'Levantamento'
                        }
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                        {isIncome ? 'Crédito' : (tx.method === 'mpesa' ? 'M-Pesa' : 'e-Mola')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-bold text-xs ${isIncome ? 'text-blue-600' : 'text-slate-700'}`}>
                      {isIncome ? '+' : '-'}{formatBRL(tx.amount)}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{timeStr}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Ativação */}
      {showActivationModal && !isActivated && (
        <ActivationModal
          onClose={() => setShowActivationModal(false)}
          onActivate={handleActivate}
        />
      )}
    </div>
  )
}
