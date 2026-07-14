'use client'

import { useState } from 'react'
import { ArrowLeft, Key, Copy, CheckCircle, Plus, AlertTriangle, Play, Lock } from 'lucide-react'
import { type PixKey } from '@/lib/store'

interface MyKeysViewProps {
  keys: PixKey[]
  onBack: () => void
  onCreateKey: () => void
}

// Function to mask CPF: 072.678.980-96 -> 072.***.***-96
function maskCPF(cpf: string): string {
  const parts = cpf.split('.')
  if (parts.length === 3) {
    const lastPart = parts[2].split('-')
    return `${parts[0]}.***.***-${lastPart[1]}`
  }
  return cpf
}

// Function to mask Celular: (84)927361054 -> (84)***361054
function maskCelular(celular: string): string {
  const match = celular.match(/$$(\d{2})$$(\d+)/)
  if (match) {
    const ddd = match[1]
    const number = match[2]
    return `(${ddd})***${number.slice(3)}`
  }
  return celular
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
    const textToCopy = `${key.name}\n${key.type === 'cpf' ? 'CPF' : 'CELULAR'}: ${maskedValue}\nBANCO: BANKPIX SSA`
    await navigator.clipboard.writeText(textToCopy)
    setCopiedId(key.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleActivateAccount = () => {
    // Fire Meta Pixel custom event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'clicou_ativar')
    }
    // Redirect to VSL page
    window.location.href = 'https://loteriasegredo.com/ativacaofinal/'
  }

  return (
    <div className="p-4 lg:p-6 pt-20 lg:pt-6">
      {/* Activate Modal */}
      {showActivateModal && (
        <>
          <div 
            className="fixed inset-0 z-[200] bg-background/90 backdrop-blur-md animate-fade-in"
            onClick={() => setShowActivateModal(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[210] max-w-md mx-auto bg-card rounded-2xl border border-border shadow-2xl p-6 animate-slide-up">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Chave Inativa</h3>
              <p className="text-muted-foreground mb-6">
                Sua conta esta no nivel BASICO. Ative sua conta para poder usar suas chaves PIX, receber transferencias e fazer saques!
              </p>
              <button
                onClick={handleActivateAccount}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 mb-3"
              >
                <Play className="w-5 h-5" />
                Ver video e ativar
              </button>
              <button
                onClick={() => setShowActivateModal(false)}
                className="w-full px-6 py-3 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted/50 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Minhas Chaves</h1>
            <p className="text-muted-foreground">{keys.length} chave(s) cadastrada(s)</p>
          </div>
        </div>
        <button
          onClick={onCreateKey}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Chave</span>
        </button>
      </div>

      {/* Keys List */}
      {keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
            <Key className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma chave cadastrada</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Cadastre sua primeira chave PIX para comecar a receber pagamentos
          </p>
          <button
            onClick={onCreateKey}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all"
          >
            <Plus className="w-5 h-5" />
            Cadastrar Chave
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => {
            const maskedValue = key.type === 'cpf' ? maskCPF(key.value) : maskCelular(key.value)
            
            return (
              <div
                key={key.id}
                className="p-4 rounded-xl bg-card border border-border"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {key.type === 'cpf' ? 'Chave CPF' : 'Chave Celular'}
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/30">
                    <Lock className="w-3 h-3 text-red-500" />
                    <span className="text-xs font-semibold text-red-500">INATIVO</span>
                  </div>
                </div>

                {/* Key Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Titular:</span>
                    <span className="font-semibold text-foreground">{key.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{key.type === 'cpf' ? 'CPF' : 'Celular'}:</span>
                    <span className="font-mono text-foreground">{maskedValue}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Banco:</span>
                    <span className="font-semibold text-primary">BANKPIX SSA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Criada em:</span>
                    <span className="text-sm text-foreground">{formatDate(key.createdAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(key)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                  >
                    {copiedId === key.id ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowActivateModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Ativar
                  </button>
                </div>
              </div>
            )
          })}

          {/* Warning Banner */}
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-500 mb-1">Chaves Inativas</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Suas chaves estao inativas. Ative sua conta para poder receber PIX e usar todas as funcionalidades!
                </p>
                <button
                  onClick={handleActivateAccount}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Ver video e ativar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
