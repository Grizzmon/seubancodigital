'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bell, BellRing, Check, LoaderCircle, Sparkles, Wrench } from 'lucide-react'

const REQUEST_KEY = 'realpayz_launch_notice_requested'
const CONFIRMED_KEY = 'realpayz_launch_notice_confirmed'

type Status = 'idle' | 'busy' | 'confirmed' | 'pending' | 'blocked' | 'unsupported' | 'install'

function decodeKey(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')), (char) => char.charCodeAt(0))
}

export function MaintenanceScreen() {
  const [status, setStatus] = useState<Status>('idle')
  const [detail, setDetail] = useState('')
  const syncing = useRef(false)
  const registerRef = useRef<Promise<ServiceWorkerRegistration> | null>(null)

  const register = () => {
    registerRef.current ??= navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(() => navigator.serviceWorker.ready)
      .catch((error) => { registerRef.current = null; throw error })
    return registerRef.current
  }

  async function saveRequest() {
    if (syncing.current) return
    syncing.current = true
    try {
      const configResponse = await fetch('/api/push-config?purpose=launch', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
      const config = await configResponse.json()
      if (!config.publicKey) throw new Error('O serviço de avisos ainda está a ser preparado.')
      const registration = await register()
      let subscription = await registration.pushManager.getSubscription()
      const desiredKey = decodeKey(config.publicKey)
      const oldKey = subscription?.options.applicationServerKey
      if (subscription && oldKey) {
        const old = new Uint8Array(oldKey)
        if (old.length !== desiredKey.length || old.some((byte, index) => byte !== desiredKey[index])) {
          await subscription.unsubscribe()
          subscription = null
        }
      }
      subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: desiredKey })
      // The browser keeps the subscription even when the server is unavailable.
      // Never claim a launch reminder is confirmed until it is stored remotely.
      const response = await fetch('/api/launch-notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }), signal: AbortSignal.timeout(12000),
      })
      if (!response.ok) throw new Error('Ainda não conseguimos confirmar o aviso no servidor.')
      localStorage.setItem(CONFIRMED_KEY, subscription.endpoint)
      setStatus('confirmed')
      setDetail('Pedido confirmado! Vamos enviar um aviso neste aparelho quando o RealPayz estiver disponível.')
    } catch {
      setStatus('pending')
      setDetail('A permissão ficou guardada neste aparelho, mas o aviso ainda não foi confirmado. Volte aqui mais tarde para concluir a ativação.')
    } finally { syncing.current = false }
  }

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const installed = matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (ios && !installed) {
      setStatus('install')
      setDetail('No iPhone, use Compartilhar → Adicionar à Tela de Início. Abra pelo ícone instalado para ativar o aviso.')
      return
    }
    if (!('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)) {
      setStatus('unsupported')
      setDetail('Para ativar o aviso, abra este endereço num navegador compatível com notificações.')
      return
    }
    void register().catch(() => {})
    if (Notification.permission === 'denied') setStatus('blocked')
    const retry = () => {
      if (localStorage.getItem(REQUEST_KEY) && Notification.permission === 'granted' && document.visibilityState === 'visible') {
        void saveRequest()
      }
    }
    retry()
    window.addEventListener('online', retry)
    document.addEventListener('visibilitychange', retry)
    return () => {
      window.removeEventListener('online', retry)
      document.removeEventListener('visibilitychange', retry)
    }
  }, [])

  async function enable() {
    if (status === 'install' || status === 'unsupported') return
    setStatus('busy')
    try {
      // Ask directly in the click handler, before awaiting any network operation.
      const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
      if (permission !== 'granted') {
        setStatus('blocked')
        setDetail('Permita as notificações nas definições deste site para receber o aviso.')
        return
      }
      localStorage.setItem(REQUEST_KEY, '1')
      await saveRequest()
    } catch {
      setStatus('idle')
      setDetail('Não foi possível ativar agora. Tente novamente no navegador principal.')
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#100e16] text-white">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-36 h-[28rem] w-[28rem] rounded-full bg-[#d21f2d]/15 blur-[100px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#9b244d]/10 blur-[100px]" />
      <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-7 sm:px-10">
        <div className="flex items-center gap-3">
          <Image src="/images/realpayz-icon.png" alt="" width={40} height={40} priority className="rounded-xl" />
          <span className="text-xl font-bold tracking-tight">RealPayz<span className="text-[#f25865]">.</span></span>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/65">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Em preparação
        </span>
      </header>

      <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-10 text-center sm:py-16">
        <div className="relative mb-9 flex h-28 w-28 items-center justify-center rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] shadow-2xl shadow-black/20">
          <Wrench className="h-11 w-11 -rotate-12 text-[#ff7b86]" strokeWidth={1.6} />
          <span className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#271721]">
            <Sparkles className="h-5 w-5 text-amber-200" />
          </span>
        </div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#ff8a94]">Estamos a cuidar de cada detalhe</p>
        <h1 className="text-balance text-[2.5rem] font-bold leading-[1.12] tracking-tight sm:text-5xl">Ops! Estamos a<br />preparar tudo.</h1>
        <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-white/60 sm:text-lg">
          O RealPayz está temporariamente indisponível enquanto concluímos os últimos ajustes.
        </p>
        <div className="mt-9 w-full rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold text-white/90"><BellRing className="h-4 w-4 text-[#ff8a94]" /> Quer saber quando voltarmos?</div>
          <button type="button" onClick={enable} disabled={['busy', 'confirmed', 'install', 'unsupported'].includes(status)}
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#d21f2d] px-5 py-4 text-base font-semibold text-white shadow-lg shadow-red-950/30 transition-colors hover:bg-[#e02a39] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-default disabled:bg-white/10 disabled:text-white/65">
            {status === 'busy' ? <LoaderCircle className="h-5 w-5 animate-spin" /> : status === 'confirmed' ? <Check className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            {status === 'busy' ? 'A confirmar…' : status === 'confirmed' ? 'Aviso ativado' : status === 'pending' ? 'Tentar confirmar aviso' : 'Ativar notificação'}
            {status === 'idle' && <ArrowRight className="h-4 w-4" />}
          </button>
          <p role="status" aria-live="polite" className="mt-4 text-sm leading-relaxed text-white/55">
            {detail || (status === 'blocked' ? 'As notificações estão bloqueadas. Pode permiti-las nas definições deste site.' : 'Ative o aviso de disponibilidade neste aparelho. Pode desativá-lo quando quiser nas definições do navegador.')}
          </p>
        </div>
        <p className="mt-6 text-sm text-white/35">Obrigado pela paciência. Até já! ❤️</p>
      </main>
      <footer className="relative px-6 pb-7 text-center text-xs text-white/30">RealPayz · Seu dinheiro sem fronteiras</footer>
    </div>
  )
}
