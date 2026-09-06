'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Bell, Download, ExternalLink, Plus, Share, X, Zap } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const INSTALLED_KEY = 'bankpix_installed'
const SESSION_DISMISS_KEY = 'bankpix_install_dismissed_session'
const SHOW_EVENT = 'bankpix_show_install'

let deferredPrompt: BeforeInstallPromptEvent | null = null

// Captura o evento nativo o mais cedo possível (antes do React montar).
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    window.dispatchEvent(new CustomEvent('bankpix_install_available'))
  })
}

type Platform = 'ios' | 'android' | 'other'

function detectPlatform(): Platform {
  const ua = window.navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'other'
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

type Mode = 'install' | 'open-app' | 'installed'

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [mode, setMode] = useState<Mode>('install')
  const [platform, setPlatform] = useState<Platform>('other')
  const [canPromptNatively, setCanPromptNatively] = useState(false)

  useEffect(() => {
    if (isStandaloneMode()) {
      // Já está a usar o app instalado: nada a fazer.
      localStorage.setItem(INSTALLED_KEY, 'true')
      return
    }

    setPlatform(detectPlatform())
    setCanPromptNatively(deferredPrompt !== null)

    const alreadyInstalled = localStorage.getItem(INSTALLED_KEY) === 'true'
    setMode(alreadyInstalled ? 'open-app' : 'install')

    // Aparece logo na entrada, salvo se o usuário fechou nesta mesma sessão.
    if (!sessionStorage.getItem(SESSION_DISMISS_KEY)) {
      const timer = window.setTimeout(() => setShow(true), 600)
      return () => window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const onAvailable = () => setCanPromptNatively(true)
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, 'true')
      deferredPrompt = null
      setMode('installed')
      setShow(true)
    }
    // Chamado ao concluir o cadastro: reabre mesmo que tenha sido fechado.
    const onForceShow = () => {
      if (isStandaloneMode()) return
      sessionStorage.removeItem(SESSION_DISMISS_KEY)
      setMode(localStorage.getItem(INSTALLED_KEY) === 'true' ? 'open-app' : 'install')
      setShow(true)
    }

    window.addEventListener('bankpix_install_available', onAvailable)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener(SHOW_EVENT, onForceShow)
    return () => {
      window.removeEventListener('bankpix_install_available', onAvailable)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener(SHOW_EVENT, onForceShow)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    if (outcome === 'accepted') {
      localStorage.setItem(INSTALLED_KEY, 'true')
      setMode('installed')
    } else {
      setCanPromptNatively(false)
    }
  }

  const handleClose = () => {
    sessionStorage.setItem(SESSION_DISMISS_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <button type="button" aria-label="Fechar" onClick={handleClose} className="absolute inset-0 bg-foreground/60 backdrop-blur-[2px] animate-fade-in" />

      <div className="relative mx-auto w-full max-w-md rounded-t-[32px] bg-background px-6 pb-10 pt-3 text-foreground shadow-2xl animate-sheet-up">
        <span className="mx-auto mb-5 block h-1.5 w-12 rounded-full bg-muted" />
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4">
          <Image
            src="/images/realpayz-icon.png"
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-2xl shadow-lg shadow-primary/30"
          />
          <div className="flex flex-col gap-1">
            <h2 id="install-title" className="text-xl font-bold leading-tight">
              {mode === 'installed'
                ? 'App instalado com sucesso!'
                : mode === 'open-app'
                  ? 'Abra pelo app RealPayz'
                  : 'Instale o app RealPayz'}
            </h2>
            <p className="text-pretty text-sm text-muted-foreground">
              {mode === 'installed'
                ? 'Encontre o ícone RealPayz na sua tela inicial e continue por lá.'
                : mode === 'open-app'
                  ? 'O RealPayz já está na sua tela inicial. Use o app para receber os avisos da sua conta.'
                  : 'Adicione à tela inicial para entrar mais rápido e receber notificações de Pix e saques.'}
            </p>
          </div>
        </div>

        {mode === 'install' ? (
          <ul className="mt-6 flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary">
                <Bell className="h-4 w-4" />
              </span>
              Avisos instantâneos de Pix recebido e saque concluído
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary">
                <Zap className="h-4 w-4" />
              </span>
              Abre em um toque, sem digitar o endereço
            </li>
          </ul>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          {mode === 'install' && canPromptNatively ? (
            <button
              type="button"
              onClick={handleInstall}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-[0.98]"
            >
              <Download className="h-5 w-5" /> Adicionar à tela inicial
            </button>
          ) : mode === 'install' ? (
            <ManualSteps platform={platform} />
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl bg-accent p-4 text-sm">
              <p className="flex items-start gap-3">
                <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  Feche esta aba, volte à <span className="font-semibold">tela inicial do celular</span> e toque no
                  ícone <span className="font-semibold">RealPayz</span>.
                </span>
              </p>
            </div>
          )}

          <button type="button" onClick={handleClose} className="py-2 text-sm font-medium text-muted-foreground">
            {mode === 'install' ? 'Continuar pelo navegador' : 'Continuar aqui mesmo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ManualSteps({ platform }: { platform: Platform }) {
  const steps =
    platform === 'ios'
      ? [
          { icon: Share, text: 'Toque no botão Compartilhar na barra do Safari' },
          { icon: Plus, text: 'Escolha "Adicionar à Tela de Início"' },
          { icon: Download, text: 'Confirme em "Adicionar" no canto superior' },
        ]
      : [
          { icon: Share, text: 'Toque no menu do navegador (três pontos)' },
          { icon: Download, text: 'Escolha "Instalar app" ou "Adicionar à tela inicial"' },
          { icon: Plus, text: 'Confirme e abra pelo ícone RealPayz' },
        ]

  return (
    <ol className="flex flex-col gap-3 rounded-2xl bg-accent p-4 text-sm">
      {steps.map(({ icon: Icon, text }, i) => (
        <li key={text} className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold text-primary">
            {i + 1}
          </span>
          <Icon className="h-4 w-4 shrink-0 text-primary" />
          <span>{text}</span>
        </li>
      ))}
    </ol>
  )
}

// Reabre o sheet de instalação de qualquer lugar (ex.: ao concluir o cadastro).
export function showInstallPrompt() {
  window.dispatchEvent(new CustomEvent(SHOW_EVENT))
}
