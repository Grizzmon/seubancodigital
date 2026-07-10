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
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { formatBRL, formatMZN, convertToMZN, type PixKey, type Transaction } from '@/lib/store'

// PIX Symbol Component - Otimizado e Suave
function PixSymbol({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="currentColor">
      <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.9 231.1 518.9 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C257.1 224.3 247.8 224.3 242.4 218.9L165.7 142.2C151.5 128 132.6 120.2 112.6 120.2H103.3L200.4 23.11C230.7-7.229 279.9-7.229 310.2 23.11L407.7 120.6H392.6C372.6 120.6 353.7 128.4 339.5 142.6L262.5 218.9zM112.6 142.7C126.4 142.7 139.1 148.3 149.7 158.1L226.4 234.8C233.6 242 243.2 246.3 253.2 246.3C263.2 246.3 272.8 242 280 234.8L356.7 158.1C367.3 147.5 380 141.9 393.8 141.9H430.3L488.6 200.3C518.9 230.6 518.9 279.8 488.6 310.1L430.3 368.4H393.8C380 368.4 367.3 362.8 356.7 352.2L280 275.5C272.8 268.3 263.2 264 253.2 264C243.2 264 233.6 268.3 226.4 275.5L149.7 352.2C139.1 362.8 126.4 368.4 112.6 368.4H77.8L23.11 310.1C-7.229 279.8-7.229 230.6 23.11 200.3L77.8 142.7H112.6z" />
    </svg>
  )
}

function ActivationModal({ onClose, onActivate }: { onClose: () => void; onActivate: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden w-full max-w-md shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-8 sm:scale-in-95 duration-300">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-blue-900 px-6 py-10 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4 shadow-inner">
            <AlertCircle className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Ative sua Conta Premium</h2>
          <p className="text-xs text-blue-200 max-w-xs mt-1.5">Desbloqueie instantaneamente todos os recursos e limites de saque.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <PixSymbol className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Uso de Chaves Instantâneas</p>
                <p className="text-[11px] text-slate-500">Envie e receba via PIX sem restrições</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Conversão Direta de Moedas</p>
                <p className="text-[11px] text-slate-500">M-Pesa, e-Mola e carteiras internacionais</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4">
            <p className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold block text-amber-950 mb-0.5">Aviso de Segurança:</span>
              Assista ao vídeo explicativo até o final na próxima página para concluir a validação dos seus dados.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 active:scale-98 transition-all"
            >
              Voltar
            </button>
            <button
              onClick={onActivate}
              className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/10"
            >
              Ver Vídeo e Ativar
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

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 antialiased selection:bg-blue-500/10">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="w-full px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-700 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-blue-600/20">
              {userInitial}
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider leading-none">Olá, bem-vindo</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{firstName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors relative active:scale-95">
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full" />
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors active:scale-95">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Framework */}
      <main className="w-full px-4 md:px-8 py-6 space-y-6 max-w-[1400px] mx-auto pb-28">
        
        {/* Balance Area Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Account Card */}
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-slate-950/10 flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Saldo em Conta</p>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1.5 transition-all">
                  {showBalance ? formatBRL(balance) : '••••••'}
                </h1>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-95"
              >
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/5 relative z-10">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Câmbio Comercial</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">1 BRL = 14,00 MZN</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 font-medium">Jurisdição e Proteção</p>
                <span className="inline-flex items-center text-[10px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-500/20 mt-0.5">
                  Garantido
                </span>
              </div>
            </div>
          </div>

          {/* Currency Conversor Alternative Panel */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversão Internacional</span>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">Metical</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Valor aproximado disponível para levantamento imediato:</p>
              <p className="text-2xl font-black text-slate-800 tracking-tight mt-4">
                {showBalance ? formatMZN(mznBalance) : 'MZN ••••••'}
              </p>
            </div>
            <button 
              onClick={() => onNavigate('withdrawal')}
              className="w-full mt-6 py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 group active:scale-98"
            >
              <span>Acessar Carteiras</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Action Systems */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Serviços e Transações</h2>
          
          {/* Grid de Ícones Mobile-Optimized */}
          <div className="grid grid-cols-5 gap-2.5 sm:gap-4">
            {[
              { label: 'PIX', icon: PixSymbol, action: () => onNavigate('my-keys'), primary: true },
              { label: 'Recarga', icon: Smartphone, action: () => setShowActivationModal(true), alert: true },
              { label: 'Enviar', icon: Send, action: () => setShowActivationModal(true), alert: true },
              { label: 'Boleto', icon: FileText, action: () => setShowActivationModal(true), alert: true },
              { label: 'Energia', icon: Zap, action: () => setShowActivationModal(true), alert: true },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className="group flex flex-col items-center text-center p-3 bg-white border border-slate-100 rounded-2xl hover:border-blue-500 hover:shadow-md transition-all active:scale-95 shadow-sm relative"
              >
                {item.alert && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-[9px] font-black text-white flex items-center justify-center rounded-full border border-white">
                    !
                  </span>
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all shadow-sm ${
                  item.primary 
                    ? 'bg-blue-600 text-white group-hover:bg-blue-700' 
                    : 'bg-slate-50 text-slate-600 group-hover:bg-slate-100'
                }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-700 truncate w-full">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Master Actions Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('create-key')}
            className="flex items-center justify-center gap-2.5 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/10 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Chave PIX</span>
          </button>

          <button
            onClick={() => onNavigate('withdrawal')}
            className="flex items-center justify-center gap-2.5 px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm active:scale-98 transition-all"
          >
            <Banknote className="w-4 h-4 text-slate-500" />
            <span>Levantar para M-Pesa / e-Mola</span>
          </button>
        </div>

        {/* Metrics & Ledger Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Summaries cards */}
          <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Entradas</p>
                <p className="text-base font-black text-slate-800 mt-0.5">{showBalance ? formatBRL(income) : '••••'}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Saídas</p>
                <p className="text-base font-black text-slate-800 mt-0.5">{showBalance ? formatBRL(totalWithdrawals) : '••••'}</p>
              </div>
            </div>
          </div>

          {/* Statement Feed Ledger */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Histórico de Atividade</h3>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50/60 px-2.5 py-1 rounded-md">
                Tempo Real
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-300">
                  <History className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">Sem registros recentes</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Suas movimentações aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {transactions.slice(0, 6).map((tx) => {
                  const txDate = new Date(tx.date)
                  const timeStr = txDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  const isIncome = tx.type === 'income'

                  return (
                    <div key={tx.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                          isIncome ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{isIncome ? 'Recebimento PIX' : 'Levantamento de Fundos'}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{timeStr} • Digital Banking</p>
                        </div>
                      </div>
                      <span className={`text-xs font-black ${isIncome ? 'text-blue-600' : 'text-slate-800'}`}>
                        {isIncome ? '+' : '-'} {formatBRL(tx.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Activation Step-Modal */}
      {showActivationModal && (
        <ActivationModal
          onClose={() => setShowActivationModal(false)}
          onActivate={() => {
            window.open('https://google.com', '_blank')
            setShowActivationModal(false)
          }}
        />
      )}
    </div>
  )
}
