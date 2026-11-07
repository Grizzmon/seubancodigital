'use client'

import { useEffect, useRef, useState } from 'react'
import { loadRememberedUser } from '@/lib/stored-user'

export interface UserReadyDetail {
  userId?: string
  newAccount?: boolean
}

export function notifyUserReady(detail: UserReadyDetail) {
  if (typeof window === 'undefined') return

  if (detail.userId) {
    try {
      localStorage.setItem('bankpix_user_id', detail.userId)
    } catch {
      // O navegador pode bloquear o armazenamento em modo privado.
    }
  }

  window.dispatchEvent(
    new CustomEvent('bankpix-user-ready', { detail }),
  )
}

type Action = 'sync' | 'activate'

const DEVICE_ENDPOINT = '/api/notification-device'
const DISMISS_KEY = 'realpayz_push_dismissed'

function keyBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const raw = atob(padded)

  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function writeDismissed(value: boolean) {
  try {
    if (value) {
      localStorage.setItem(DISMISS_KEY, '1')
    } else {
      localStorage.removeItem(DISMISS_KEY)
    }
  } catch {
    // Continua a funcionar sem guardar a preferência.
  }
}

export default function ServiceWorkerRegister() {
  const [supported, setSupported] = useState(false)
  const [needsInstall, setNeedsInstall] = useState(false)
  const [permission, setPermission] =
    useState<NotificationPermission>('default')
  const [linked, setLinked] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [hasAccount, setHasAccount] = useState(false)

  const busyRef = useRef(false)
  const subscriptionRef = useRef<PushSubscriptionJSON | null>(null)
  const syncRef = useRef<(action?: Action) => Promise<void>>(
    async () => {},
  )

  useEffect(() => {
    let cancelled = false
    let running: Promise<void> | null = null

    const ios =
      /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' &&
        navigator.maxTouchPoints > 1)

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone ===
        true

    const capable =
      window.isSecureContext &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setNeedsInstall(ios && !standalone)
    setSupported(capable)
    setHasAccount(Boolean(loadRememberedUser()))
    setDismissed(readDismissed())

    const openPanel = () => {
      writeDismissed(false)
      setDismissed(false)

      if ('Notification' in window) {
        setPermission(Notification.permission)
      }
    }

    window.addEventListener('realpayz-open-notifications', openPanel)

    if (!capable) {
      return () => {
        cancelled = true
        window.removeEventListener(
          'realpayz-open-notifications',
          openPanel,
        )
      }
    }

    setPermission(Notification.permission)

    const registrationPromise = navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then(() => navigator.serviceWorker.ready)

    async function sync(action: Action = 'sync'): Promise<void> {
      if (cancelled) return

      if (running) {
        await running

        if (action === 'activate' && !cancelled) {
          return sync(action)
        }

        return
      }

      running = Promise.resolve().then(async () => {
        try {
          if (cancelled) return

          setPermission(Notification.permission)

          if (Notification.permission !== 'granted') {
            subscriptionRef.current = null
            setLinked(false)
            return
          }

          const response = await fetch(
            '/api/push-config?purpose=launch',
            { cache: 'no-store' },
          )

          const config = await response.json().catch(() => null)

          if (!response.ok || !config?.publicKey) {
            throw new Error(
              'Notificações indisponíveis no servidor.',
            )
          }

          const registration = await registrationPromise
          if (cancelled) return

          const key = keyBytes(config.publicKey)
          let subscription =
            await registration.pushManager.getSubscription()

          const oldKey =
            subscription?.options.applicationServerKey

          if (
            subscription &&
            oldKey &&
            !bytesEqual(new Uint8Array(oldKey), key)
          ) {
            await subscription.unsubscribe()
            subscription = null
          }

          if (!subscription) {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: key.buffer as ArrayBuffer,
            })
          }

          if (cancelled) return

          const saved = await fetch(DEVICE_ENDPOINT, {
            method: 'POST',
            keepalive: true,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action,
              subscription: subscription.toJSON(),
            }),
          })

          const result = await saved.json().catch(() => null)

          if (result?.expired) {
            await subscription.unsubscribe().catch(() => {})
            subscriptionRef.current = null

            throw new Error(
              'A inscrição expirou. Toque em “Ativar notificações” novamente.',
            )
          }

          if (!saved.ok || !result?.success) {
            throw new Error(
              result?.error ||
                'Não foi possível guardar os avisos.',
            )
          }

          if (cancelled) return

          subscriptionRef.current = subscription.toJSON()
          setLinked(true)
          setHasAccount(Boolean(result.hasAccount))

          setMessage(
            action === 'activate' && result.activationSent
              ? 'Notificações ativadas! Confirmação enviada ao aparelho.'
              : 'Avisos automáticos ativos neste aparelho.',
          )
        } catch (error) {
          if (!cancelled) {
            setLinked(false)
            setMessage(
              error instanceof Error
                ? error.message
                : 'Falha ao ativar as notificações.',
            )
          }
        } finally {
          running = null
        }
      })

      await running
    }

    syncRef.current = sync

    function sendOnExit() {
      if (
        !subscriptionRef.current ||
        Notification.permission !== 'granted'
      ) {
        return
      }

      const body = JSON.stringify({
        action: 'exit',
        subscription: subscriptionRef.current,
      })

      let queued = false

      try {
        queued = navigator.sendBeacon(
          DEVICE_ENDPOINT,
          new Blob([body], {
            type: 'application/json',
          }),
        )
      } catch {
        // Fallback para fetch
      }

      if (!queued) {
        void fetch(DEVICE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
          keepalive: true,
        }).catch(() => {})
      }
    }

    const onReady = () => {
      setHasAccount(Boolean(loadRememberedUser()))
      void sync()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        sendOnExit()
      } else {
        void sync()
      }
    }

    const onOnline = () => {
      void sync()
    }

    void registrationPromise
      .then(() => sync())
      .catch(() => {
        if (!cancelled) {
          setMessage(
            'Atualize a página para preparar as notificações.',
          )
        }
      })

    window.addEventListener('bankpix-user-ready', onReady)
    window.addEventListener('pagehide', sendOnExit)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      syncRef.current = async () => {}

      window.removeEventListener(
        'realpayz-open-notifications',
        openPanel,
      )
      window.removeEventListener('bankpix-user-ready', onReady)
      window.removeEventListener('pagehide', sendOnExit)
      window.removeEventListener('online', onOnline)
      document.removeEventListener(
        'visibilitychange',
        onVisibility,
      )
    }
  }, [])

  async function activate() {
    if (busyRef.current || !supported || needsInstall) return

    busyRef.current = true
    setBusy(true)
    setMessage('')

    try {
      const result =
        Notification.permission === 'default'
          ? await Notification.requestPermission()
          : Notification.permission

      setPermission(result)

      if (result === 'granted') {
        await syncRef.current('activate')
      } else if (result === 'denied') {
        setMessage(
          'Notificações bloqueadas. Permita-as nas definições do navegador.',
        )
      } else {
        setMessage(
          'A permissão não foi concedida. Pode tentar novamente.',
        )
      }
    } catch {
      setMessage(
        'Não foi possível ativar. Abra o site no navegador principal.',
      )
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  function dismiss() {
    writeDismissed(true)
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <aside
      aria-label="Notificações da conta"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-sm rounded-2xl border border-border bg-background p-4 text-foreground shadow-xl"
    >
      <button
        type="button"
        aria-label="Fechar aviso de notificações"
        onClick={dismiss}
        className="absolute right-3 top-2 p-2"
      >
        ×
      </button>

      <p className="pr-6 font-semibold">
        Receba os avisos do RealPayz 🔔
      </p>

      <p className="mt-2 text-sm text-muted-foreground">
        {needsInstall
          ? 'No iPhone/iPad, adicione à Tela de Início pelo menu Compartilhar e abra o app instalado.'
          : !supported
            ? 'Abra este site em HTTPS num navegador compatível com notificações.'
            : permission === 'denied'
              ? 'Permita os avisos nas definições deste site no navegador.'
              : hasAccount
                ? 'Receba confirmações de recebimentos e avisos da sua conta em tempo real.'
                : 'Receba um lembrete para finalizar sua conta e aproveitar todas as vantagens da RPZ.'}
      </p>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className="mt-2 text-sm"
        >
          {message}
        </p>
      )}

      {linked && (
        <p className="mt-2 text-xs text-muted-foreground">
          Avisos automáticos ativos neste aparelho.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {supported &&
          !needsInstall &&
          permission !== 'denied' && (
            <button
              type="button"
              disabled={busy}
              onClick={activate}
              className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy
                ? 'A ativar…'
                : linked
                  ? 'Confirmar notificações'
                  : 'Ativar notificações'}
            </button>
          )}

        <button
          type="button"
          onClick={dismiss}
          className="rounded-xl border border-border px-4 py-2 text-sm"
        >
          {linked ? 'Fechar' : 'Agora não'}
        </button>
      </div>
    </aside>
  )
}
