'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let installPromptEvent: BeforeInstallPromptEvent | null = null

export function InstallPrompt() {
  const [showModal, setShowModal] = useState(false)
  const [showTopBar, setShowTopBar] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }

    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    if (standalone) return

    if (installPromptEvent) setCanInstall(true)

    const installed = localStorage.getItem('bankpix_installed')
    if (!installed) setShowTopBar(true)

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      installPromptEvent = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }

    const handleShow = () => {
      if (!standalone) setTimeout(() => setShowModal(true), 1500)
    }

    const handleInstalled = () => {
      localStorage.setItem('bankpix_installed', 'true')
      setShowTopBar(false)
      setShowModal(false)
      setCanInstall(false)
      installPromptEvent = null
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('bankpix_show_install', handleShow)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('bankpix_show_install', handleShow)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (installPromptEvent) {
      await installPromptEvent.prompt()
      const { outcome } = await installPromptEvent.userChoice
      if (outcome === 'accepted') {
        localStorage.setItem('bankpix_installed', 'true')
        setShowTopBar(false)
        setShowModal(false)
      }
      installPromptEvent = null
      setCanInstall(false)
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      if (isIOS) {
        alert('Para instalar:\n\n1. Toque no icone compartilhar\n2. Toque em "Adicionar a Tela de Inicio"')
      } else {
        alert('Para instalar:\n\n1. Toque nos 3 pontinhos\n2. Toque em "Adicionar a tela inicial"')
      }
    }
  }

  if (isStandalone) return null

  return (
    <>
      {showTopBar && (
        <div className="fixed top-0 left-0 right-0 z-[9000] bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 shadow-lg">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Instale o App BankPix</p>
                <p className="text-xs text-white/70">Acesso rapido</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleInstall} className="px-4 py-1.5 rounded-lg bg-white text-primary text-sm font-bold active:scale-95 transition-transform">
                BAIXAR
              </button>
              <button onClick={() => setShowTopBar(false)} className="p-1 text-white/70">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <>
          <div className="fixed inset-0 z-[9998] bg-black/70" onClick={() => setShowModal(false)} />
          <div className="fixed inset-x-4 bottom-6 z-[9999] max-w-sm mx-auto">
            <div className="bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl p-6">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-1 text-white/50">
                <X className="w-5 h-5" />
              </button>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Download className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white text-center mb-2">Baixar o App BankPix</h2>
              <p className="text-sm text-white/60 text-center mb-6">Adicione na sua tela inicial</p>
              <button onClick={handleInstall} className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg active:scale-95 transition-transform">
                BAIXAR AGORA
              </button>
              <button onClick={() => setShowModal(false)} className="w-full mt-3 py-2 text-white/50 text-sm">
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
