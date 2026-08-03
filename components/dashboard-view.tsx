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
  FileText,
  Bell,
  Settings,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatBRL, formatMZN, convertToMZN, type PixKey, type Transaction } from '@/lib/store'

// PIX Symbol Component
function PixSymbol({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="currentColor">
      <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.9 231.1 518.9 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C257.1 224.3 247.8 224.3 242.4 218.9L165.7 142.2C151.5 128 132.6 120.2 112.6 120.2H103.3L200.4 23.11C230.7-7.229 279.9-7.229 310.2 23.11L407.7 120.6H392.6C372.6 120.6 353.7 128.4 339.5 142.6L262.5 218.9zM112.6 142.7C126.4 142.7 139.1 148.3 149.7 158.1L226.4 234.8C233.6 242 243.2 246.3 253.2 246.3C263.2 246.3 272.8 242 280 234.8L356.7 158.1C367.3 147.5 380 141.9 393.8 141.9H430.3L488.6 200.3C518.9 230.6 518.9 279.8 488.6 310.1L430.3 368.4H393.8C380 368.4 367.3 362.8 356.7 352.2L280 275.5C272.8 268.3 263.2 264 253.2 264C243.2 264 233.6 268.3 226.4 275.5L149.7 352.2C139.1 362.8 126.4 368.4 112.6 368.4H77.8L23.11 310.1C-7.229 279.8-7.229 230.6 23.11 200.3L77.8 142.7H112.6z" />
    </svg>
  )
}

// Modal PRO Sucesso
function ProSuccessModal({
  featureName,
  onClose,
}: {
  featureName: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] overflow-hidden max-w-sm w-full shadow-2xl p-8 border border-emerald-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
          Você é um PRO agora, parabéns! 🎉
        </h3>

        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          O recurso de <span className="font-bold text-slate-700">{featureName}</span> está totalmente desbloqueado e ativo na sua conta sem qualquer limitação!
        </p>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98]"
        >
          Continuar aproveitando
        </button>
      </div>
    </div>
  )
}

// Activation Modal - Padrão de Bloqueio
function ActivationModal({
  onClose,
  onActivate,
}: {
  onClose: () => void
  onActivate: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[24px] overflow-hidden max-w-md w-full shadow-2xl animate-in scale-in-95 duration-300 border border-slate-100">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 px-6 py-12 flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-3 mx-auto">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Ative sua Conta</h2>
            <p className="text-sm text-white/90 text-center mt-2">Desbloqueie todos os recursos premium</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
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

          <div className="bg-amber-50 border border-amber-200 rounded-[12px] p-3.5">
            <p className="text-xs text-amber-900 font-medium leading-relaxed">
              <span className="font-bold block mb-1">Importante:</span>
              Assista o vídeo até o final para ativar permanentemente sua conta.
            </p>
          </div>

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
  const [showProModal, setShowProModal] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState('')

  // LEITURA DO PARÂMETRO NA URL (?acesso=vip)
  const searchParams = useSearchParams()
  const isUnlocked = searchParams.get('acesso') === 'vip'

  const rawFirstName = userName.split(' ')[0] || 'Usuário'
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase()
  const userInitial = firstName.charAt(0).toUpperCase()

  const mznBalance = convertToMZN(balance)

  const totalWithdrawals = transactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((acc, t) => acc + t.amount, 0)

  const handleFeatureClick = (featureName: string) => {
    if (isUnlocked) {
      setSelectedFeature(featureName)
      setShowProModal(true)
    } else {
      setShowActivationModal(true)
    }
  }

  const handleActivate = () => {
    window.open('https://loteriasegredo.com/activebankpixaccount/', '_blank')
    setShowActivationModal(false)
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-start items-stretch">
      {/* Header Fixo */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 shadow-md border-b border-blue-500/20 w-full">
        <div className="px-4 py-3.5 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center font-extrabold text-white text-lg shadow-sm">
                {userInitial}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-blue-100 font-medium leading-none mb-1">
                  {isUnlocked ? 'Perfil PRO Ativo ✨' : 'Bem-vindo de volta 👋'}
                </span>
                <p className="text-white font-extrabold text-lg leading-tight">
                  Olá, {firstName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleFeatureClick('Notificações')} 
                className="p-2 rounded-lg hover:bg-white/15 text-white transition-colors duration-200"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleFeatureClick('Configurações')} 
                className="p-2 rounded-lg hover:bg-white/15 text-white transition-colors duration-200"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="px-4 py-5 w-full space-y-5 pb-24">
          
          {/* Balance Card */}
          <div className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white p-5 shadow-lg border border-blue-500/20">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative space-y-5">
              <div className="flex items-end justify-between">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold tracking-widest text-blue-100 uppercase mb-1.5">Saldo Disponível</p>
                  <p className="text-3xl font-extrabold text-white tracking-tight">
                    {showBalance ? formatBRL(balance) : 'R$ ••••••'}
                  </p>
                </div>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2.5 rounded-[12px] bg-white/15 hover:bg-white/25 border border-white/20 text-blue-100 hover:text-white transition-all duration-200 ml-3"
                  aria-label="Toggle balance visibility"
                >
                  {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-[12px] p-3.5 backdrop-blur-sm">
                <p className="text-[11px] text-blue-100 font-medium mb-1">Equivalente em Metical</p>
                <p className="text-xl font-bold text-white">
                  {showBalance ? formatMZN(mznBalance) : '0,00 MZN'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-100">
                <span className="font-medium">Câmbio: 1 BRL = 14,00 MZN</span>
                <span className="inline-block px-2.5 py-1 bg-white/20 rounded-[6px] font-semibold border border-white/30">
                  Seguro
                </span>
              </div>
            </div>
          </div>

          {/* Operations Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Operações Rápidas</h3>
              <p className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">5 Serviços</p>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {/* PIX - Continua livre e navega normalmente */}
              <button
                onClick={() => onNavigate('my-keys')}
                className="group flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-[16px] hover:border-blue-500 transition-all duration-200 active:scale-95 shadow-sm"
              >
                <div className="w-11 h-11 rounded-[12px] bg-blue-50 flex items-center justify-center text-blue-600 mb-1.5 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                  <PixSymbol className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">PIX</span>
              </button>

              {/* RECARGA */}
              <button
                onClick={() => handleFeatureClick('Recarga de Celular')}
                className="group relative flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-[16px] transition-all duration-200 active:scale-95 shadow-sm"
              >
                {!isUnlocked && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    !
                  </span>
                )}
                <div className="w-11 h-11 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-600 mb-1.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">Recarga</span>
              </button>

              {/* ENVIAR */}
              <button
                onClick={() => handleFeatureClick('Envio de Valores')}
                className="group relative flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-[16px] transition-all duration-200 active:scale-95 shadow-sm"
              >
                {!isUnlocked && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    !
                  </span>
                )}
                <div className="w-11 h-11 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-600 mb-1.5">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">Enviar</span>
              </button>

              {/* BOLETO */}
              <button
                onClick={() => handleFeatureClick('Pagamento de Boleto')}
                className="group relative flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-[16px] transition-all duration-200 active:scale-95 shadow-sm"
              >
                {!isUnlocked && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    !
                  </span>
                )}
                <div className="w-11 h-11 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-600 mb-1.5">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">Boleto</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => onNavigate('create-key')}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[16px] transition-all duration-200 text-sm font-bold shadow-md shadow-blue-600/20 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Cadastrar Chave PIX</span>
            </button>

            <button
              onClick={() => onNavigate('withdrawal')}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-white border border-slate-200 text-slate-800 rounded-[16px] hover:bg-slate-50 transition-all duration-200 text-sm font-bold shadow-sm active:scale-95"
            >
              <Banknote className="w-5 h-5 text-slate-600" />
              <span>Levantar para M-Pesa / e-Mola</span>
            </button>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-[16px] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Entradas</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{showBalance ? formatBRL(income) : '••••'}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-[16px] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-[10px] bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Saídas</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{showBalance ? formatBRL(totalWithdrawals) : '••••'}</p>
            </div>
          </div>

          {/* Recent Statement */}
          <div className="bg-white border border-slate-200 rounded-[18px] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-900">Extrato Recente</h3>
              </div>
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-[6px] uppercase border border-blue-100">
                Atualizado
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-[12px] bg-slate-50 border border-slate-200 flex items-center justify-center">
                    <ArrowDownLeft className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Nenhuma movimentação</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Suas transações aparecerão aqui</p>
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
                    <div key={tx.id} className={`flex items-center justify-between ${idx === 0 ? '' : 'pt-2.5'}`}>
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-[10px] flex items-center justify-center border ${
                            isIncome
                              ? 'bg-blue-50 border-blue-100 text-blue-600'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {isIncome ? 'Recebimento' : 'Levantamento'}
                          </p>
                          <p className="text-[10px] text-slate-400">{timeStr}</p>
                        </div>
                      </div>

                      <p className={`text-xs font-bold ${isIncome ? 'text-blue-600' : 'text-slate-900'}`}>
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

      {/* Modal Padrão de Bloqueio */}
      {showActivationModal && (
        <ActivationModal
          onClose={() => setShowActivationModal(false)}
          onActivate={handleActivate}
        />
      )}

      {/* Modal PRO Sucesso */}
      {showProModal && (
        <ProSuccessModal
          featureName={selectedFeature}
          onClose={() => setShowProModal(false)}
        />
      )}
    </div>
  )
}
