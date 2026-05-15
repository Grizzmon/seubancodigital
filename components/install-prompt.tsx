'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

// Interface para o evento do Chrome
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showTopBar, setShowTopBar] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // 1. Verifica se já está instalado
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone === true
      setIsStandalone(isStandaloneMode)
    }
    checkStandalone()

    // 2. Escuta o evento oficial do Chrome (O MAIS IMPORTANTE)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault() // Impede a barra padrão feia do Chrome
      setDeferredPrompt(e as BeforeInstallPromptEvent) // Guarda o evento no Estado do React
      
      // Só mostra a barra se NÃO estiver instalado e NÃO tiver fechado antes
      const wasClosed = localStorage.getItem('bankpix_prompt_closed')
      if (!wasClosed) setShowTopBar(true)
    }

    // 3. Escuta o comando de mostrar modal após o cadastro
    const handleManualShow = () => {
      setShowModal(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('bankpix_show_install', handleManualShow)
    window.addEventListener('appinstalled', () => {
      setIsStandalone(true)
      setShowTopBar(false)
      setShowModal(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('bankpix_show_install', handleManualShow)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Se chegamos aqui sem o evento, o Chrome ainda não validou o PWA
      alert('O sistema está preparando o instalador. Tente novamente em 3 segundos ou use o menu do navegador.')
      return
    }

    // DISPARA A JANELA OFICIAL DE INSTALAÇÃO (A que você quer!)
    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('Usuário aceitou a instalação')
      setDeferredPrompt(null)
      setShowTopBar(false)
      setShowModal(false)
    }
  }

  if (isStandalone) return null

  return (
    <>
      {/* BARRA NO TOPO */}
      {showTopBar && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-primary p-3 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-500">
           <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-lg">
                <Smartphone className="text-white w-5 h-5" />
             </div>
             <span className="text-white font-bold text-sm uppercase italic">Instalar BankPix App</span>
           </div>
           <div className="flex gap-2">
             <button onClick={handleInstall} className="bg-white text-primary px-4 py-1.5 rounded-full font-black text-xs">BAIXAR</button>
             <button onClick={() => { setShowTopBar(false); localStorage.setItem('bankpix_prompt_closed', 'true'); }} className="text-white/70 p-1"><X size={20}/></button>
           </div>
        </div>
      )}

      {/* MODAL DE SUCESSO (Aparece após cadastro) */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[32px] p-8 border border-white/10 shadow-2xl text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Download className="text-primary w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase italic mb-2 italic tracking-tighter">Conta Criada!</h2>
            <p className="text-white/60 mb-8 text-sm uppercase font-bold tracking-widest">Para continuar, baixe o nosso App Oficial.</p>
            
            <button onClick={handleInstall} className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl uppercase italic shadow-lg shadow-primary/30 active:scale-95 transition-all">
               BAIXAR AGORA
            </button>
            <button onClick={() => setShowModal(false)} className="mt-4 text-white/30 text-xs uppercase font-bold">Instalar mais tarde</button>
          </div>
        </div>
      )}
    </>
  )
}

export function showInstallPrompt() {
  window.dispatchEvent(new CustomEvent('bankpix_show_install'))
}
