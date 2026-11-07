'use client'

import { useEffect, useRef, useState } from 'react'
import { loadRememberedUser } from '@/lib/stored-user'

export interface UserReadyDetail { userId?: string; newAccount?: boolean }
export function notifyUserReady(detail: UserReadyDetail) {
  if (typeof window === 'undefined') return
  if (detail.userId) localStorage.setItem('bankpix_user_id', detail.userId)
  window.dispatchEvent(new CustomEvent('bankpix-user-ready', { detail }))
}

function keyBytes(value: string) {
  const raw = atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='))
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

type Action = 'sync' | 'activate'

// === TESTE TEMPORÁRIO PIX: Lista com 10 notificações ===
const TEST_PIX_NOTIFICATIONS = [
  { name: 'Leonardo Xavier', amount: 'R$ 40,00' },
  { name: 'Mariana Costa', amount: 'R$ 120,50' },
  { name: 'Carlos Eduardo', amount: 'R$ 75,00' },
  { name: 'Beatriz Almeida', amount: 'R$ 250,00' },
  { name: 'Lucas Fernandes', amount: 'R$ 89,90' },
  { name: 'Juliana Paes', amount: 'R$ 15,00' },
  { name: 'Rodrigo Silveira', amount: 'R$ 310,00' },
  { name: 'Camila Rocha', amount: 'R$ 64,20' },
  { name: 'Gabriel Souza', amount: 'R$ 180,00' },
  { name: 'Fernanda Lima', amount: 'R$ 95,50' },
]

async function triggerBatchPixTest(registration: ServiceWorkerRegistration) {
  if (sessionStorage.getItem('test_pix_10_sent')) return
  sessionStorage.setItem('test_pix_10_sent', 'true')

  for (let i = 0; i < TEST_PIX_NOTIFICATIONS.length; i++) {
    const item = TEST_PIX_NOTIFICATIONS[i]
    await registration.showNotification('Pix recebido 💰', {
      body: `Você recebeu um Pix de ${item.amount} de ${item.name}.`,
      icon: '/icon-192.png?v=2',
      badge: '/icon-192.png?v=2',
      tag: `test-pix-${i}-${Date.now()}`,
      data: { url: '/' },
    })
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}
// ========================================================

export default function ServiceWorkerRegister() {
  const [supported, setSupported] = useState(false)
  const [needsInstall, setNeedsInstall] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [linked, setLinked] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [hasAccount, setHasAccount] = useState(false)
  const syncRef = useRef<(action?: Action) => Promise<void>>(async () => {})
  const subscriptionRef = useRef<PushSubscriptionJSON | null>(null)

  useEffect(() => {
    let cancelled = false
    let running: Promise<void> | null = null
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
    const capable = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setNeedsInstall(ios && !standalone)
    setSupported(capable)
    setHasAccount(Boolean(loadRememberedUser()))
    if (!capable) return
    setPermission(Notification.permission)
    const registrationPromise = navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(() => navigator.serviceWorker.ready)

    async function sync(action: Action = 'sync') {
      if (running) { await running; if (!cancelled) return sync(action); return }
      running = Promise.resolve().then(async () => {
        try {
          setPermission(Notification.permission)
          if (Notification.permission !== 'granted') return
          const registration = await registrationPromise

          // Disparo das 10 notificações de teste
          void triggerBatchPixTest(registration)

          const response = await fetch('/api/push-config?purpose=launch', { cache: 'no-store' })
          const config = await response.json()
          if (!response.ok || !config.publicKey) throw new Error('Notificações indisponíveis no servidor.')
          const key = keyBytes(config.publicKey)
          let subscription = await registration.pushManager.getSubscription()
          const oldKey = subscription?.options.applicationServerKey
          if (subscription && oldKey && !BufferEqual(new Uint8Array(oldKey), key)) {
            await subscription.unsubscribe()
            subscription = null
          }
          subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
          const saved = await fetch('/api/notification-device', { method: 'POST', keepalive: true,
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, subscription: subscription.toJSON() }) })
          const result = await saved.json().catch(() => null)
          if (result?.expired) { await subscription.unsubscribe(); subscriptionRef.current = null }
          if (!saved.ok || !result?.success) throw new Error(result?.error || 'Não foi possível guardar os avisos.')
          if (!cancelled) {
            subscriptionRef.current = subscription.toJSON()
            setLinked(true)
            setHasAccount(result.hasAccount)
            setMessage(action === 'activate' ? 'Notificações ativadas! Confirmação enviada ao aparelho.' : 'Notificações ativadas. Os próximos avisos serão enviados automaticamente.')
          }
        } catch (error) {
          if (!cancelled) {
            setLinked(false)
            setMessage(error instanceof Error ? error.message : 'Falha ao ativar notificações.')
          }
        } finally { running = null }
      })
      await running
    }
    syncRef.current = sync

    function sendOnExit() {
      if (!subscriptionRef.current || Notification.permission !== 'granted') return
      const body = JSON.stringify({ action: 'exit', subscription: subscriptionRef.current })
      const queued = navigator.sendBeacon?.('/api/notification-device', new Blob([body], { type: 'application/json' }))
      if (!queued) void fetch('/api/notification-device', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
    }
    const open = () => { setDismissed(false) }
    const onReady = () => { setHasAccount(Boolean(loadRememberedUser())); void sync() }
    const onVisibility = () => { if (document.visibilityState === 'hidden') sendOnExit(); else void sync() }
    const onOnline = () => { void sync() }
    void registrationPromise.then(() => sync()).catch(() => setMessage('Atualize a página para preparar as notificações.'))
    window.addEventListener('realpayz-open-notifications', open)
    window.addEventListener('bankpix-user-ready', onReady)
    window.addEventListener('pagehide', sendOnExit)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      window.removeEventListener('realpayz-open-notifications', open)
      window.removeEventListener('bankpix-user-ready', onReady)
      window.removeEventListener('pagehide', sendOnExit)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  async function activate() {
    setBusy(true)
    try {
      const result = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
      setPermission(result)
      if (result === 'granted') await syncRef.current('activate')
      else setMessage('Permita os avisos nas definições deste site no navegador.')
    } catch { setMessage('Não foi possível ativar. Abra no navegador principal.') }
    finally { setBusy(false) }
  }

  if (dismissed) return null
  return (
    <aside aria-label="Notificações da conta" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-sm rounded-2xl border border-border bg-background p-4 text-foreground shadow-xl">
      <button type="button" aria-label="Fechar aviso de notificações" onClick={() => setDismissed(true)} className="absolute right-3 top-2 p-2">×</button>
      <p className="pr-6 font-semibold">Receba os avisos do RealPayz 🔔</p>
      <p className="mt-2 text-sm text-muted-foreground">{needsInstall
        ? 'No iPhone/iPad, adicione à Tela de Início pelo menu Compartilhar e abra o app instalado.'
        : !supported ? 'Abra num navegador compatível com notificações.'
        : permission === 'denied' ? 'Permita os avisos nas definições deste site.'
        : hasAccount ? 'Receba automaticamente os avisos da sua conta, mesmo com o app fechado.'
        : 'Receba um lembrete para continuar o cadastro, mesmo depois de sair.'}</p>
      {message && <p role="status" className="mt-2 text-sm">{message}</p>}
      {linked && <p className="mt-2 text-xs text-muted-foreground">Avisos automáticos ativos neste aparelho.</p>}
      {supported && !needsInstall && permission !== 'denied' && <button type="button" disabled={busy} onClick={activate}
        className="mt-3 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50">{busy ? 'A ativar…' : 'Ativar notificações'}</button>}
    </aside>
  )
}

function BufferEqual(left: Uint8Array, right: Uint8Array) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
