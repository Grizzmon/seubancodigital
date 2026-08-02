'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Captura o evento nativo de instalação do navegador (Chrome/Android/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Pequeno delay (3 segundos) para não bombardear o usuário imediatamente ao carregar
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Se o usuário já abriu pelo app instalado (modo standalone), não mostra nada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Dispara a janela oficial de instalação do celular
    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('O usuário instalou o aplicativo!')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white p-4 rounded-[20px] shadow-2xl flex items-center justify-between gap-3">
        {/* Lado esquerdo: Ícone do App + Texto */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 text-white font-extrabold text-lg shadow-md border border-blue-400/30">
            BP
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold leading-tight text-white">Instalar o BankPix</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">Adicione à tela inicial para acesso rápido</p>
          </div>
        </div>

        {/* Lado direito: Botão de Ação e Botão Fechar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-[12px] transition-all shadow-md shadow-blue-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>

          <button
            onClick={() => setShowPrompt(false)}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
