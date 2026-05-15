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
        <div className="bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl p-6">
          {/* Botao fechar */}
          <button onClick={handleClose} className="absolute top-4 right-4 p-1 text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          
          {/* Icone */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Download className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          {/* Texto */}
          <h2 className="text-xl font-bold text-white text-center mb-2">Baixar o App BankPix</h2>
          <p className="text-sm text-white/60 text-center mb-6">
            Adicione o BankPix na sua tela inicial para acesso rapido
          </p>
          
          {/* Botao instalar */}
          <button
            onClick={handleInstall}
            className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/30 active:scale-95 transition-transform"
          >
            BAIXAR AGORA
          </button>
          
          {/* Link cancelar */}
          <button onClick={handleClose} className="w-full mt-3 py-2 text-white/50 text-sm">
            Agora nao
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
