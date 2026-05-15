'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [showModal, setShowModal] = useState(false)
  const [showTopBar, setShowTopBar] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true)
  const [isIOS, setIsIOS] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Registra o Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Verifica se e iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

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

    // Captura o evento de instalacao
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Escuta evento para mostrar modal (apos cadastro)
    const handleShow = () => {
      if (standalone) return
      setTimeout(() => setShowModal(true), 1500)
    }

    window.addEventListener('bankpix_show_install', handleShow)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('bankpix_show_install', handleShow)
    }
  }, [])

  const handleInstall = async () => {
    // Se tem o prompt do Chrome, usa ele
    if (deferredPromptRef.current) {
      try {
        await deferredPromptRef.current.prompt()
        const { outcome } = await deferredPromptRef.current.userChoice
        if (outcome === 'accepted') {
          localStorage.setItem('bankpix_installed', 'true')
          setShowTopBar(false)
          setShowModal(false)
        }
        deferredPromptRef.current = null
      } catch (err) {
        // Se falhar, mostra instrucoes manuais
        showManualInstructions()
      }
    } else {
      // Se nao tem o prompt, mostra instrucoes manuais
      showManualInstructions()
    }
  }

  const showManualInstructions = () => {
    if (isIOS) {
      alert('Para instalar o BankPix:\n\n1. Toque no icone de compartilhar (quadrado com seta)\n2. Role para baixo e toque em "Adicionar a Tela de Inicio"\n3. Toque em "Adicionar"')
    } else {
      alert('Para instalar o BankPix:\n\n1. Toque nos 3 pontinhos no canto superior direito do Chrome\n2. Toque em "Adicionar a tela inicial"\n3. Toque em "Adicionar"')
    }
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
      {/* BARRA FIXA NO TOPO */}
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

      {/* MODAL */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-[9998] bg-black/70" onClick={handleCloseModal} />
          
          <div className="fixed inset-x-4 bottom-6 z-[9999] max-w-sm mx-auto">
            <div className="bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl p-6">
              <button onClick={handleCloseModal} className="absolute top-4 right-4 p-1 text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Download className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-white text-center mb-2">Baixar o App BankPix</h2>
              <p className="text-sm text-white/60 text-center mb-6">
                Adicione o BankPix na sua tela inicial para acesso rapido
              </p>
              
              <button
                onClick={handleInstall}
                className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/30 active:scale-95 transition-transform"
              >
                BAIXAR AGORA
              </button>
              
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

export function showInstallPrompt() {
  localStorage.setItem('bankpix_first_registration', 'true')
  window.dispatchEvent(new CustomEvent('bankpix_show_install'))
}
