'use client'

import { useState } from 'react'
import { ArrowLeft, Key, Copy, CheckCircle, Plus, Eye, X, PlayCircle, ShieldCheck, Lock } from 'lucide-react'
import { type PixKey } from '@/lib/store'

interface MyKeysViewProps {
  keys: PixKey[]
  onBack: () => void
  onCreateKey: () => void
}

// Funções de máscara com os *** padronizados
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

  const handleCopy = async (key: PixKey) => {
    const maskedValue = key.type === 'cpf' ? maskCPF(key.value) : maskCelular(key.value)
    const textToCopy = `${key.name}\nCHAVE ${key.type === 'cpf' ? 'CPF' : 'CELULAR'}: ${maskedValue}\nINSTITUIÇÃO: BANKPIX SSA`
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 pt-12 pb-20">
      
      {/* MODAL DE ATIVAÇÃO (ESTILO AZUL & BRANCO) */}
      {showActivateModal && (
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

      {/* HEADER */}
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

        {/* LISTA DE CHAVES */}
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
            {keys.map((key) => {
              const labelType = key.type === 'cpf' ? 'CPF' : key.type === 'celular' ? 'Celular' : 'Aleatória'
              const maskedValue = key.type === 'cpf' ? maskCPF(key.value) : maskCelular(key.value)

              return (
                <div
                  key={key.id}
                  className="p-6 rounded-3xl bg-white border border-blue-100 shadow-xl shadow-blue-500/5 space-y-4"
                >
                  {/* Topo do Card: Titular e Instituição */}
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

                    {/* Status Badge */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Pendente</span>
                    </div>
                  </div>

                  {/* Linha da Chave Oculta com Blur e Ícone do Olho */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="space-y-0.5">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                        Chave ({labelType})
                      </span>
                      <div className="font-mono text-sm font-semibold text-slate-800">
                        <span className="select-none blur-[1.5px] tracking-wider opacity-90">
                          {maskedValue}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">Criada em: {formatDate(key.createdAt)}</span>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => setShowActivateModal(true)} 
                      className="p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all active:scale-95 border border-blue-100 shadow-sm"
                      aria-label="Visualizar chave"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Botão de Copiar */}
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

            {/* CAIXA INFERIOR DE AVISO DE ATIVAÇÃO */}
            <div className="p-5 rounded-3xl bg-blue-50/60 border border-blue-100 text-center space-y-3 mt-6">
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
          </div>
        )}
      </div>
    </div>
  )
}
