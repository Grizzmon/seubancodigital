'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Key, Copy, CheckCircle, Plus, Eye, X, PlayCircle, ShieldCheck, Lock, Unlock, AlertTriangle, RefreshCw } from 'lucide-react'
import { type PixKey } from '@/lib/store'

interface MyKeysViewProps {
  keys: PixKey[]
  onBack: () => void
  onCreateKey: () => void
}

const TUTORA_PAY_LINK = "https://pay.tutora.co.mz/e6cc1edc66244aa7b142f8049459b73b"

function maskCPF(cpf: string): string {
  const parts = cpf.split('.')
  if (parts.length === 3) {
    const lastPart = parts[2].split('-')
    return `${parts[0]}.***.***-${lastPart[1]}`
  }
  return `${cpf.slice(0, 3)}.***.***-${cpf.slice(-2)}`
}

function maskCelular(celular: string): string {
  if (celular.includes('***')) return celular
  return `+258 84 *** ***${celular.slice(-2)}`
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function MyKeysView({ keys, onBack, onCreateKey }: MyKeysViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [showBacenModal, setShowBacenModal] = useState(false)
  
  const searchParams = useSearchParams()
  const isUnlocked = searchParams.get('acesso') === 'vip'

  const handleCopy = async (key: PixKey) => {
    const textValue = isUnlocked ? key.value : (key.type === 'cpf' ? maskCPF(key.value) : maskCelular(key.value))
    const textToCopy = `${key.name}\nCHAVE ${key.type === 'cpf' ? 'CPF' : 'CELULAR'}: ${textValue}\nINSTITUIÇÃO: BANKPIX SSA`
    await navigator.clipboard.writeText(textToCopy)
    setCopiedId(key.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleActivateAccount = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      ;(window as any).fbq('trackCustom', 'clicou_ativar')
    }
    window.location.href = 'https://loteriasegredo.com/activebankpixaccount/'
  }

  const handleEyeClick = () => {
    if (!isUnlocked) {
      setShowActivateModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 pt-12 pb-20">
      
      {showActivateModal && !isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-blue-100 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowActivateModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Ativação Necessária
            </h3>
            
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Para ver sua chave, utilizar todos os recursos, receber e fazer saque no Mpesa e Emola veja o vídeo completo e ative sua conta.
            </p>

            <button 
              onClick={handleActivateAccount}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              <PlayCircle className="w-5 h-5" />
              Assistir Vídeo e Ativar
            </button>
          </div>
        </div>
      )}

      {showBacenModal && isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-amber-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowBacenModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Ativação & Vinculação BACEN
            </h3>
            
            <p className="text-xs text-slate-600 mb-4 leading-relaxed text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
              Para realizar a vinculação oficial da sua chave junto ao Banco Central do Brasil (BACEN) e garantir a funcionalidade definitiva sem bloqueios nas redes M-Pesa e e-Mola, é necessário o pagamento de uma taxa adicional de <span className="font-bold text-slate-900">399 MZN</span>.
            </p>

            <div className="space-y-2 mb-6 text-left text-xs text-slate-600 font-medium">
              <p className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Sincronização imediata no BACEN
              </p>
              <p className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Garantia de funcionamento definitivo
              </p>
            </div>

            <a 
              href={TUTORA_PAY_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] text-sm"
            >
              Continuar e Pagar 399 MZN
            </a>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Minhas Chaves</h1>
              <p className="text-xs text-slate-500">{keys.length} chave(s) cadastrada(s)</p>
            </div>
          </div>

          <button
            onClick={onCreateKey}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Chave</span>
          </button>
        </div>

        {keys.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-blue-100 shadow-sm text-center flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Key className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhuma chave cadastrada</h3>
            <p className="text-slate-500 text-xs mb-6 max-w-xs">
              Cadastre sua primeira chave PIX para começar a receber transferências
            </p>
            <button
              onClick={onCreateKey}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              Cadastrar Chave
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {isUnlocked && (
              <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 text-left space-y-3 mb-6 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 font-medium leading-relaxed">
                    Caso a sua chave PIX não esteja funcionando, será necessário fazer um update da sua chave com o <span className="font-bold underline">Banco Central do Brasil</span> para garantir a utilização 100% garantida!
                  </p>
                </div>
                <button
                  onClick={() => setShowBacenModal(true)}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 active:scale-[0.98]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Verificar / Atualizar Chave no BACEN
                </button>
              </div>
            )}

            {!isUnlocked && (
              <div className="p-5 rounded-3xl bg-blue-50/60 border border-blue-100 text-center space-y-3 mb-6">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para ver sua chave, utilizar todos os recursos, receber e fazer saque no Mpesa e Emola veja o vídeo completo e ative sua conta.
                </p>
                <button
                  onClick={handleActivateAccount}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/10 active:scale-[0.98]"
                >
                  <PlayCircle className="w-4 h-4" />
                  Ver Vídeo e Ativar Conta
                </button>
              </div>
            )}

            {keys.map((key) => {
              const labelType = key.type === 'cpf' ? 'CPF' : key.type === 'celular' ? 'Celular' : 'Aleatória'
              const maskedValue = key.type === 'cpf' ? maskCPF(key.value) : maskCelular(key.value)

              return (
                <div
                  key={key.id}
                  className="p-6 rounded-3xl bg-white border border-blue-100 shadow-xl shadow-blue-500/5 space-y-4"
                >
                  <div className="pb-3 border-b border-slate-100 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-0.5">Titular</span>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{key.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-slate-400">Instituição:</span>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          Bankpix SSA
                        </span>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Ativa</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Pendente</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="space-y-0.5">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                        Chave ({labelType})
                      </span>
                      <div className="font-mono text-sm font-semibold text-slate-800">
                        <span className={isUnlocked ? 'tracking-wider text-slate-900 font-bold' : 'select-none blur-[1.5px] tracking-wider opacity-90'}>
                          {isUnlocked ? key.value : maskedValue}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">Criada em: {formatDate(key.createdAt)}</span>
                    </div>

                    <button 
                      type="button" 
                      onClick={handleEyeClick} 
                      className={`p-3 rounded-2xl transition-all active:scale-95 border shadow-sm ${
                        isUnlocked 
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100'
                      }`}
                      aria-label="Visualizar chave"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleCopy(key)}
                    className="w-full py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {copiedId === key.id ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-500" />
                        Copiar Dados da Chave
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
