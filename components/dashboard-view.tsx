'use client'

import { Eye, EyeOff, TrendingUp, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, Banknote, KeyRound, ArrowRight, History, ShieldCheck } from 'lucide-react'
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

  // Tratamento rigoroso do nome: Primeira Letra Sempre Maiúscula
  const rawFirstName = userName.split(' ')[0] || ''
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase()

  const mznBalance = convertToMZN(balance)

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((acc, t) => acc + t.amount, 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-300 antialiased pb-12 text-slate-900">
      
      {/* 1. SAUDAÇÃO E STATUS */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
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

      {/* 2. CARD DE SALDO PREMIUM (ESTILO AZUL CORPORATIVO DE ALTO PADRÃO) */}
      <div className="relative overflow-hidden rounded-[32px] bg-slate-950 text-white p-7 shadow-[0_24px_48px_-12px_rgba(37,99,235,0.18)] border border-slate-900">
        {/* Elemento de iluminação azul no fundo do card */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-[64px] -translate-y-12 translate-x-12" />
        
        <div className="relative space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Saldo Disponível</span>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white transition-all border border-slate-800"
              aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            >
              {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-4xl font-bold tracking-tight text-white transition-all">
              {showBalance ? formatBRL(balance) : 'R$ ••••••'}
            </p>
            <div className="flex items-center gap-1.5 text-blue-400 font-medium">
              <TrendingUp className="w-4 h-4" />
              <p className="text-sm">
                Equivale a <span className="font-bold text-white">{showBalance ? formatMZN(mznBalance) : 'MZN ••••••'}</span>
              </p>
            </div>
          </div>

          {/* ADICIONAL LINDO: Tabela de conversões integrada como widget profissional */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-medium">Câmbio Comercial Fixado</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg text-slate-300 font-semibold">1 BRL = 14,00 MZN</span>
          </div>
        </div>
      </div>

      {/* 3. ZONA DE AÇÕES RÁPIDAS (NATIVE GRID INTERATIVO) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Ações Principais</h3>
        
        <div className="grid grid-cols-3 gap-2.5">
          {/* AÇÃO 1: AREA PIX */}
          <button
            onClick={() => onNavigate('my-keys')}
            className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-500/20 transition-all hover:bg-slate-50/50 text-center space-y-2.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-center text-blue-600">
              <PixSymbol className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700 tracking-tight block">Área Pix</span>
          </button>

          {/* AÇÃO 2: CADASTRAR CHAVE CHAVE */}
          <button
            onClick={() => onNavigate('create-key')}
            className="flex flex-col items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all text-center space-y-2.5 shadow-md shadow-blue-600/10 active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold tracking-tight block">Nova Chave</span>
          </button>

          {/* AÇÃO 3: LEVANTAR M-PESA */}
          <button
            onClick={() => onNavigate('withdrawal')}
            className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-500/20 transition-all hover:bg-slate-50/50 text-center space-y-2.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-center text-blue-600">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700 tracking-tight block">Levantar</span>
          </button>
        </div>
      </div>

      {/* 4. BALANÇOS ENTRADAS / SAÍDAS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Entradas</span>
            <p className="text-base font-bold text-slate-800">{showBalance ? formatBRL(income) : '••••'}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Saídas</span>
            <p className="text-base font-bold text-slate-800">{showBalance ? formatBRL(totalWithdrawals) : '••••'}</p>
          </div>
        </div>
      </div>

      {/* 5. HISTÓRICO DE EXTRATOS (MODERNO E LIMPO) */}
      <div className="rounded-[28px] bg-white border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800">Extrato Recente</h3>
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Atualizado</span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 mx-auto">
              <ArrowDownLeft className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-700">Nenhuma movimentação identificada</p>
            <p className="text-[11px] text-slate-400 font-light">Seus envios e recebimentos Pix surgirão listados aqui.</p>
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
                        ? 'bg-blue-50/60 border-blue-100 text-blue-600' 
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

    </div>
  )
}
