'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

// Captura o evento de instalacao assim que a pagina carrega
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
  })
}

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Verifica se ja esta instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Escuta evento para mostrar modal
    const handleShow = () => {
      if (standalone) return
      const dismissed = localStorage.getItem('bankpix_install_dismissed')
      if (dismissed) return
      setTimeout(() => setShow(true), 1500)
    }

    window.addEventListener('bankpix_show_install', handleShow)
    return () => window.removeEventListener('bankpix_show_install', handleShow)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        localStorage.setItem('bankpix_installed', 'true')
      }
      deferredPrompt = null
    }
    setShow(false)
  }

  const handleClose = () => {
    localStorage.setItem('bankpix_install_dismissed', 'true')
    setShow(false)
  }

  if (!show || isStandalone) return null

  return (
    <>
      {/* Fundo escuro */}
      <div className="fixed inset-0 z-[9998] bg-black/70" onClick={handleClose} />
      
      {/* Modal */}
      <div className="fixed inset-x-4 bottom-6 z-[9999] max-w-sm mx-auto">
        <div className="relative bg-background rounded-3xl border border-border shadow-2xl p-6">
          {/* Botao fechar */}
          <button onClick={handleClose} aria-label="Fechar" className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
          
          {/* Icone */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary/30">
              <Download className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          
          {/* Texto */}
          <h2 className="text-xl font-bold text-foreground text-center mb-2">Instalar o RealPayz</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Adicione o RealPayz à sua tela inicial para acesso rápido
          </p>
          
          {/* Botao instalar */}
          <button
            onClick={handleInstall}
            className="w-full h-14 rounded-full bg-brand-gradient text-primary-foreground font-semibold text-base shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
          >
            Instalar agora
          </button>
          
          {/* Link cancelar */}
          <button onClick={handleClose} className="w-full mt-3 py-2 text-muted-foreground text-sm font-medium">
            Agora não
          </button>
        </div>
      </div>
    </>
  )
}

// Funcao para chamar o modal de qualquer lugar
export function showInstallPrompt() {
  localStorage.setItem('bankpix_first_registration', 'true')
  window.dispatchEvent(new CustomEvent('bankpix_show_install'))
}
