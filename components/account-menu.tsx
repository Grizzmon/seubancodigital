'use client'

import { useState } from 'react'
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
  ChevronRight
} from 'lucide-react'

interface AccountMenuProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  userPhone: string
}

const menuItems = [
  { id: 'dados', label: 'Dados cadastrais', icon: User },
  { id: 'trocar', label: 'Trocar numero ou senha', icon: Phone },
  { id: 'baixar', label: 'Baixar app', icon: Download },
  { id: 'idiomas', label: 'Idiomas', icon: Globe },
  { id: 'temas', label: 'Temas', icon: Palette },
  { id: 'config', label: 'Configuracoes', icon: Settings },
  { id: 'suporte', label: 'Suporte e atendimento', icon: HelpCircle },
  { id: 'cancelar', label: 'Cancelar conta', icon: XCircle, danger: true },
  { id: 'contestar', label: 'Contestar um Pix', icon: AlertTriangle },
  { id: 'estado', label: 'Estado da conta', icon: Shield },
]

export function AccountMenu({ isOpen, onClose, userName, userPhone }: AccountMenuProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const handleMenuClick = () => {
    setShowUpgradeModal(true)
  }

  const handleActivateAccount = () => {
    // Fire Meta Pixel custom event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'clicou_ativar')
    }
    // Redirect to VSL page
    window.location.href = 'https://loteriasegredo.com/bankpixativarhoje/'
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed left-0 top-0 bottom-0 z-[120] w-[85vw] max-w-sm bg-card border-r border-border shadow-2xl animate-slide-in-left">
        {/* Header with user info */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-card p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Minha Conta</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-card/50 hover:bg-card transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          {/* User Name - Visible and clear */}
          <div className="bg-card/80 rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Nome completo</p>
            <p className="text-lg font-bold text-foreground uppercase">{userName}</p>
            <div className="flex items-center gap-2 mt-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{userPhone}</p>
            </div>
          </div>

          {/* Account Level */}
          <div className="mt-4 bg-card/80 rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nivel da conta</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">
                    BASICO
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Info className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>
        </div>

        {/* Menu Items - All inactive */}
        <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={handleMenuClick}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 ${
                item.danger
                  ? 'text-destructive/50 hover:bg-destructive/5'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 opacity-50" />
                <ChevronRight className="w-4 h-4 opacity-50" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <>
          <div 
            className="fixed inset-0 z-[130] bg-background/90 backdrop-blur-md animate-fade-in"
            onClick={() => setShowUpgradeModal(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[140] max-w-md mx-auto bg-card rounded-2xl border border-border shadow-2xl p-6 animate-slide-up">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-4">
                <Shield className="w-8 h-8 text-amber-500" />
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-2">
                Conta nivel BASICO
              </h3>
              
              <p className="text-muted-foreground mb-6">
                Atualize seu nivel para poder ativar sua conta e cadastrar sua chave, receber Pix e fazer saque no M-Pesa e e-Mola!
              </p>

              <div className="w-full space-y-3">
                <button
                  onClick={handleActivateAccount}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/25"
                >
                  Ativar conta agora
                </button>
                
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-3 rounded-xl bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-all duration-200"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
