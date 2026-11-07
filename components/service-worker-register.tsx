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
          const response = await fetch('/api/push-config?purpose=launch', { cache: 'no-store' })
          const config = await response.json()
          if (!response.ok || !config.publicKey) throw new Error('Notificações indisponíveis no servidor.')
          const key = keyBytes(config.publicKey)
          let subscription = await registrationPromise.then((reg) => reg.pushManager.getSubscription())
          const oldKey = subscription?.options.applicationServerKey
          if (subscription && oldKey && !BufferEqual(new Uint8Array(oldKey), key)) {
            await subscription.unsubscribe()
            subscription = null
          }
          const registration = await registrationPromise
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
      window.removeEventListener('
