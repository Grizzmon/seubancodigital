'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  X, 
  User, 
  Phone, 
  Download, 
  Globe, 
  Palette, 
  Settings, 
  HelpCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Info,
  Lock,
  ChevronRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react'

interface AccountMenuProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  userPhone: string
}

const menuItems = [
  { id: 'dados', label: 'Dados cadastrais', icon: User },
  { id: 'trocar', label: 'Trocar número ou senha', icon: Phone },
  { id: 'baixar', label: 'Baixar aplicativo', icon: Download },
  { id: 'idiomas', label: 'Idiomas do sistema', icon: Globe },
  { id: 'temas', label: 'Customizar tema', icon: Palette },
  { id: 'config', label: 'Configurações avançadas', icon: Settings },
  { id: 'suporte', label: 'Suporte e atendimento', icon: HelpCircle },
  { id: 'contestar', label: 'Contestar transação Pix', icon: AlertTriangle },
  { id: 'estado', label: 'Estado operacional da conta', icon: Shield },
  { id: 'cancelar', label: 'Encerrar conta digital', icon: XCircle, danger: true },
]

export function AccountMenu({ isOpen, onClose, userName, userPhone }: AccountMenuProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [activeItemLabel, setActiveItemLabel] = useState<string | null>(null)

  // LEITURA DO PARÂMETRO NA URL (?acesso=vip)
  const searchParams = useSearchParams()
  const isUnlocked = searchParams.get('acesso') === 'vip'

  const handleMenuClick = (itemLabel: string) => {
    setActiveItemLabel(itemLabel)
    setShowUpgradeModal(true)
  }

  const handleActivateAccount = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      ;(window as any).fbq('trackCustom', 'clicou_ativar')
    }
    window.location.href = 'https://loteriasegredo.com/activebankpixaccount/'
  }

  if (!isOpen) return null

  return (
    <>
      {/* Fundo Desfocado */}
      <div 
        className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />

      {/* Painel do Menu Lateral */}
      <div className="fixed left-0 top-0 bottom-0 z-[120] w-[88vw] max-w-sm bg-white text-slate-900 shadow-[20px_0_60px_-15px_rgba(15,23,42,0.08)] flex flex-col justify-between antialiased">
        
        <div>
          {/* Topo / Perfil do Usuário */}
          <div className="p-6 bg-slate-50 border-b border-slate-100 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Perfil Digital</p>
                  <h2 className="text-base font-bold text-slate-800">Minha Conta</h2>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Informações Pessoais */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Titular da Conta</span>
                <p className="text-sm font-bold text-slate-800 uppercase truncate">{userName}</p>
              </div>
              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-50 text-slate-500">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-xs font-medium">{userPhone}</p>
              </div>
            </div>

            {/* STATUS DO PERFIL: PRO (Verde Esmeralda) OU BÁSICO (Amarelo Alerta) */}
            {isUnlocked ? (
              <div className="mt-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-600/90 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" /> Sem limitações ativas
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-700 tracking-wider">NÍVEL PRO</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div className="mt-4 bg-amber-50/60 border border-amber-100/80 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-600/80 uppercase tracking-wide">Limitações de Recursos</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-700">NÍVEL BÁSICO</span>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveItemLabel(null); setShowUpgradeModal(true) }}
                  className="p-2 rounded-xl bg-white hover:bg-amber-100/50 border border-amber-200 text-amber-600 transition-colors shadow-xs"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Listagem de Opções de Menu */}
          <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-270px)] custom-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.label)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                  item.danger
                    ? 'text-red-500 hover:bg-red-50/50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <item.icon className={`w-4 h-4 ${item.danger ? 'text-red-400' : 'text-slate-400 group-hover:text-blue-600'}`} />
                  <span className="text-sm font-medium tracking-tight">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-60">
                  {!isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-300" />}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Rodapé do Menu */}
        <div className="p-6 border-t border-slate-50 text-center bg-slate-50/50">
          <p className="text-[11px] font-medium text-slate-400 tracking-wide">BankPix S.A. • Versão 2.4.0</p>
        </div>
      </div>

      {/* MODAIS (MUDAM SE FOR PRO OU BÁSICO) */}
      {showUpgradeModal && (
        <>
          <div 
            className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowUpgradeModal(false)}
          />

          {isUnlocked ? (
            /* MODAL DE SUCESSO PARA USUÁRIOS PRO */
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[140] max-w-sm mx-auto bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(15,23,42,0.15)] p-8 border border-emerald-100 flex flex-col items-center text-center antialiased animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                Você é um PRO agora, parabéns! 🎉
              </h3>
              
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {activeItemLabel ? `O recurso "${activeItemLabel}" está totalmente ativado e disponível na sua conta sem limitações.` : 'Sua conta está totalmente desbloqueada com acesso PRO ilimitado.'}
              </p>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98]"
              >
                Continuar usando
              </button>
            </div>
          ) : (
            /* MODAL PADRÃO DE BLOQUEIO PARA NÍVEL BÁSICO */
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[140] max-w-sm mx-auto bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(15,23,42,0.15)] p-8 border border-slate-100 flex flex-col items-center text-center antialiased animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100/60 flex items-center justify-center text-blue-600 mb-6 shadow-sm">
                <Shield className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                Conta Pendente de Ativação
              </h3>
              
              <p className="text-sm text-slate-500 font-light leading-relaxed mb-8 px-1">
                Para liberar transações via Pix, realizar saques diretos para M-Pesa e e-Mola e cadastrar suas chaves personalizadas, faça a ativação segura do seu perfil.
              </p>

              <div className="w-full space-y-3">
                <button
                  onClick={handleActivateAccount}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm tracking-wide transition-all shadow-md shadow-blue-600/10 active:scale-[0.98]"
                >
                  Ativar perfil agora
                </button>
                
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-semibold text-xs tracking-wide uppercase transition-all"
                >
                  Voltar ao painel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
