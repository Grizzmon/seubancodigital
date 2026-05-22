'use client'

import { useState } from 'react'
import { AlertTriangle, X, CheckCircle, CreditCard, Shield, Zap } from 'lucide-react'

export function InactiveAccountBar() {
  const [showModal, setShowModal] = useState(false)

  const handleActivate = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'clicou_ativar')
    }
    setShowModal(true)
  }

  const handleGoToPayment = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'clicou_desbloquear')
    }
    window.location.href = 'https://obtenhaagora.vercel.app/'
  }

  return (
    <>
      {/* BARRA FIXA NO TOPO */}
      <div className="fixed top-0 left-0 right-0 z-[8000] bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Conta inativa</p>
              <p className="text-xs text-white/80">Ative para desbloquear e comece a usar ja!</p>
            </div>
          </div>
          <button
            onClick={handleActivate}
            className="px-4 py-2 rounded-lg bg-white text-red-600 text-sm font-bold shadow-md hover:bg-white/90 active:scale-95 transition-all"
          >
            ATIVAR AGORA
          </button>
        </div>
      </div>

      {/* MODAL DE INSTRUCOES */}
      {showModal && (
        <>
          {/* Fundo escuro */}
          <div 
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-4 z-[9999] flex items-center justify-center">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 bg-[#0f172a] p-5 border-b border-white/10">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Como ativar sua conta</h2>
                    <p className="text-sm text-white/60">Siga os passos abaixo</p>
                  </div>
                </div>
              </div>

              {/* Passos */}
              <div className="p-5 space-y-4">
                {/* Passo 1 */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Escolha seu plano</h3>
                      <p className="text-sm text-white/60">Selecione entre os planos disponiveis:</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                          <CreditCard className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-white">Basico</span>
                          <span className="text-xs text-white/40">- Funcoes essenciais</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-primary/30">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="text-sm text-white font-semibold">Pro</span>
                          <span className="text-xs text-primary">- Mais popular</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                          <Shield className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-white">Ultra</span>
                          <span className="text-xs text-white/40">- Todos os recursos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Faca o pagamento</h3>
                      <p className="text-sm text-white/60">
                        Clique em ativar e realize o pagamento do plano escolhido de forma segura.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Aguarde o PIN</h3>
                      <p className="text-sm text-white/60">
                        Apos o pagamento, voce recebera um PIN de confirmacao para ativar sua conta.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white flex-shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Conta ativada!</h3>
                      <p className="text-sm text-white/60">
                        Sua conta estara ativa e pronta para receber PIX normalmente apos a confirmacao.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Aviso */}
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-200">
                      <strong>Importante:</strong> Sem a ativacao, voce nao conseguira receber transferencias PIX nem realizar saques.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botao */}
              <div className="sticky bottom-0 bg-[#0f172a] p-5 border-t border-white/10">
                <button
                  onClick={handleGoToPayment}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-green-500 text-white font-bold text-lg shadow-lg shadow-primary/30 hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  QUERO DESBLOQUEAR
                </button>
                <p className="text-xs text-center text-white/40 mt-3">
                  Ao clicar, voce sera redirecionado para a pagina de ativacao
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
