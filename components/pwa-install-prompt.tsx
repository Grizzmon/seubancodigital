'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, X } from 'lucide-react'

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Captura o evento nativo de instalação do navegador (Chrome/Android/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Pequeno delay (3 segundos) para não bombardear o usuário imediatamente ao carregar,
      // e recolhe sozinho depois de alguns segundos para não atrapalhar o cadastro.
      setTimeout(() => {
        setShowPrompt(true)
        setTimeout(() => setShowPrompt(false), 8000)
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
    // Fica no topo para não cobrir os botões de ação das telas de entrada.
    <div className="fixed top-3 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-top duration-300">
      <div className="bg-background/95 backdrop-blur-md border border-border text-foreground p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3">
        {/* Lado esquerdo: Ícone do App + Texto */}
        <div className="flex items-center gap-3">
          <Image
            src="/images/realpayz-icon.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl shrink-0"
          />
          <div className="flex flex-col">
            <p className="text-xs font-bold leading-tight">Instalar o RealPayz</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Adicione à tela inicial para acesso rápido</p>
          </div>
        </div>

        {/* Lado direito: Botão de Ação e Botão Fechar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-gradient active:scale-95 text-primary-foreground font-semibold text-xs rounded-full transition-all shadow-md shadow-primary/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>

          <button
            onClick={() => setShowPrompt(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
