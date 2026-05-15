'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

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
  const [showModal, setShowModal] = useState(false)
  const [showTopBar, setShowTopBar] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true) // Comeca como true para nao piscar

  useEffect(() => {
    // Verifica se ja esta instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Se nao esta instalado, mostra o botao no topo
    if (!standalone) {
      const installed = localStorage.getItem('bankpix_installed')
      if (!installed) {
        setShowTopBar(true)
      }
    }

    // Escuta evento para mostrar modal (apos cadastro)
    const handleShow = () => {
      if (standalone) return
      setTimeout(() => setShowModal(true), 1500)
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
        setShowTopBar(false)
      }
      deferredPrompt = null
    }
    setShowModal(false)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleCloseTopBar = () => {
    setShowTopBar(false)
  }

  // Nao mostra nada se ja esta instalado
  if (isStandalone) return null

  return (
    <>
      {/* BARRA FIXA NO TOPO - Sempre visivel ate instalar */}
      {showTopBar && (
        <div className="fixed top-0 left-0 right-0 z-[9000] bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 shadow-lg">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Instale o App BankPix</p>
                <p className="text-xs text-white/70">Acesso rapido na tela inicial</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="px-4 py-1.5 rounded-lg bg-white text-primary text-sm font-bold shadow-md active:scale-95 transition-transform"
              >
                BAIXAR
              </button>
              <button onClick={handleCloseTopBar} className="p-1 text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL - Aparece apos cadastro */}
      {showModal && (
        <>
          {/* Fundo escuro */}
          <div className="fixed inset-0 z-[9998] bg-black/70" onClick={handleCloseModal} />
          
          {/* Modal */}
          <div className="fixed inset-x-4 bottom-6 z-[9999] max-w-sm mx-auto">
            <div className="bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl p-6">
              {/* Botao fechar */}
              <button onClick={handleCloseModal} className="absolute top-4 right-4 p-1 text-white/50 hover:text-white">
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
              <button onClick={handleCloseModal} className="w-full mt-3 py-2 text-white/50 text-sm">
                Agora nao
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// Funcao para chamar o modal de qualquer lugar
export function showInstallPrompt() {
  localStorage.setItem('bankpix_first_registration', 'true')
  window.dispatchEvent(new CustomEvent('bankpix_show_install'))
}
