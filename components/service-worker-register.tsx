'use client'

import { useEffect, useRef, useState } from 'react'
import { loadStoredUser } from '@/lib/stored-user'

const USER_ID_KEY = 'bankpix_user_id'
const PENDING_KEY = 'bankpix_welcome_pending'
const SENT_PREFIX = 'bankpix_welcome_sent_'

export interface UserReadyDetail { userId?: string; newAccount?: boolean }

export function notifyUserReady(detail: UserReadyDetail) {
  if (typeof window === 'undefined') return
  if (detail.userId) {
    localStorage.setItem(USER_ID_KEY, detail.userId)
    if (!localStorage.getItem(SENT_PREFIX + detail.userId)) localStorage.setItem(PENDING_KEY, detail.userId)
  }
  window.dispatchEvent(new CustomEvent('bankpix-user-ready', { detail }))
}

function keyBytes(value: string) {
  const raw = atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='))
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

export default function ServiceWorkerRegister() {
  const [identified, setIdentified] = useState(false)
  const [supported, setSupported] = useState(false)
  const [needsInstall, setNeedsInstall] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [linked, setLinked] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const syncRef = useRef<() => Promise<void>>(async () => {})
  const endpointRef = useRef<string | null>(null)

  useEffect(() => {
    const open = () => { setIdentified(true); setDismissed(false) }
    window.addEventListener('realpayz-open-notifications', open)
    return () => window.removeEventListener('realpayz-open-notifications', open)
  }, [])

  useEffect(() => {
    let cancelled = false
    let running: Promise<void> | null = null
    let rerun = false
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const standalone = matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setNeedsInstall(ios && !standalone)
    const capable = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(capable)
    setIdentified(Boolean(localStorage.getItem(USER_ID_KEY)))
    if (!capable) return
    setPermission(Notification.permission)

    async function sync() {
      if (running) { rerun = true; return running }
      running = (async () => {
        try {
          setPermission(Notification.permission)
          if (Notification.permission !== 'granted') return
          let userId = localStorage.getItem(USER_ID_KEY)
          if (!userId) {
            const phone = localStorage.getItem('realpayz_session_phone')
            const profile = phone ? loadStoredUser(phone) : null
            if (!profile) throw new Error('Entre na sua conta para ativar as notificações.')
            const registered = await fetch('/api/register-user', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: profile.name, phone: profile.phone, accessType: 'FREE' }),
            })
            const account = await registered.json().catch(() => null)
            if (!registered.ok || !account?.userId) throw new Error('Não foi possível vincular sua conta às notificações. Tente novamente.')
            userId = account.userId
            localStorage.setItem(USER_ID_KEY, account.userId)
          }
          const response = await fetch('/api/push-config', { cache: 'no-store' })
          const config = await response.json()
          if (!response.ok || !config.configured || !config.publicKey) throw new Error(config.error || 'Notificações indisponíveis no servidor.')
          const registration = await navigator.serviceWorker.ready
          const key = keyBytes(config.publicKey)
          let subscription = await registration.pushManager.getSubscription()
          const oldKey = subscription?.options.applicationServerKey
          if (subscription && oldKey && !BufferEqual(new Uint8Array(oldKey), key)) {
            await subscription.unsubscribe()
            subscription = null
          }
          subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
          // Always persist again: localStorage is not proof that the server still
          // has this endpoint, especially after a database cleanup or reinstall.
          const saved = await fetch('/api/save-subscription', {
            method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
          })
          if (!saved.ok) throw new Error('Não foi possível guardar a inscrição. Tente novamente.')
          if (!cancelled) {
            endpointRef.current = subscription.endpoint
            setLinked(true)
            setMessage('Notificações ativadas. Pode testar o recebimento.')
          }
        } catch (error) {
          if (!cancelled) {
            setLinked(false)
            setMessage(error instanceof Error ? error.message : 'Falha ao ativar notificações.')
          }
        } finally { running = null }
      })()
      const current = running
      await current
      if (rerun && !cancelled) { rerun = false; await sync() }
    }
    syncRef.current = sync

    // Fire on hidden/pagehide rather than beforeunload. A beacon can outlive the
    // tab; the server sends the push, never a timer in the closing page.
    function sendOnExit() {
      const userId = localStorage.getItem(USER_ID_KEY)
      const endpoint = endpointRef.current
      if (!userId || !endpoint || Notification.permission !== 'granted' ||
          localStorage.getItem(SENT_PREFIX + userId)) return
      const payload = JSON.stringify({ userId, endpoint })
      const queued = navigator.sendBeacon?.('/api/welcome-push', new Blob([payload], { type: 'application/json' }))
      if (!queued) void fetch('/api/welcome-push', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true,
      }).catch(() => {})
      // Do not mark as delivered: only a successful server response/cron may do so.
    }
    function onReady() {
      setIdentified(Boolean(localStorage.getItem(USER_ID_KEY)))
      setDismissed(false)
      void sync()
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') sendOnExit()
      else void sync()
    }
    const onOnline = () => { void sync() }
    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(async (registration) => { await registration.update().catch(() => {}); await sync() })
      .catch(() => setMessage('Não foi possível preparar as notificações. Atualize a página e tente novamente.'))
    window.addEventListener('bankpix-user-ready', onReady)
    window.addEventListener('pagehide', sendOnExit)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      window.removeEventListener('bankpix-user-ready', onReady)
      window.removeEventListener('pagehide', sendOnExit)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  async function enable() {
    setBusy(true)
    try {
      // This MUST be the first async call in this button's click handler. Waiting
      // for serviceWorker.ready first loses user activation on Safari and Firefox.
      const result = Notification.permission === 'default'
        ? await Notification.requestPermission() : Notification.permission
      setPermission(result)
      if (result === 'granted') await syncRef.current()
      else setMessage('Permita as notificações nas definições deste site no navegador.')
    } catch { setMessage('Não foi possível pedir a permissão. Abra no navegador principal.') }
    finally { setBusy(false) }
  }

  async function test() {
    setBusy(true)
    try {
      const response = await fetch('/api/welcome-push', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: localStorage.getItem(USER_ID_KEY), endpoint: endpointRef.current, test: true }),
      })
      const result = await response.json()
      setMessage(response.ok && result.success
        ? 'Teste enviado ao serviço de push. Verifique as notificações do aparelho.'
        : result.expired ? 'A inscrição expirou. Toque em ativar novamente.' : result.error || 'O serviço de push recusou o envio. Verifique as chaves VAPID no servidor.')
      if (result.expired) { setLinked(false); await syncRef.current() }
    } catch { setMessage('Sem conexão para enviar o teste. Tente novamente.') }
    finally { setBusy(false) }
  }

  if (!identified || dismissed) return null
  return (
    <aside aria-label="Notificações da conta" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-sm rounded-2xl border border-border bg-background p-4 text-foreground shadow-xl">
      <button type="button" aria-label="Fechar aviso de notificações" onClick={() => setDismissed(true)} className="absolute right-3 top-2 p-2">×</button>
      <p className="pr-6 font-semibold">Receba os avisos da sua conta 🔔</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {needsInstall ? 'No iPhone/iPad, adicione à Tela de Início pelo menu Compartilhar. Abra o app instalado e ative os avisos.'
          : !supported ? 'Abra este site num navegador com suporte a notificações, como Chrome ou Safari atualizado.'
          : permission === 'denied' ? 'As notificações estão bloqueadas. Permita os avisos nas definições deste site e volte aqui.'
          : 'Ative os avisos para receber uma mensagem mesmo depois de sair do site ou do app.'}
      </p>
      {message && <p role="status" className="mt-2 text-sm">{message}</p>}
      {supported && !needsInstall && permission !== 'denied' && (
        <button type="button" disabled={busy} onClick={linked ? test : enable}
          className="mt-3 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50">
          {busy ? 'Aguarde…' : linked ? 'Testar notificação' : 'Ativar notificações'}
        </button>
      )}
    </aside>
  )
}

function BufferEqual(left: Uint8Array, right: Uint8Array) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
