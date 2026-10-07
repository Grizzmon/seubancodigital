import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { VAPID_CONTACT } from './push-config'

// Mesmos valores públicos usados em lib/supabase.ts (a anon key é pública por design).
// Em produção o SUPABASE_SERVICE_ROLE_KEY tem prioridade para não esbarrar em RLS.
const FALLBACK_SUPABASE_URL = 'https://cjxfvpkbfixjkppowhwg.supabase.co'
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGZ2cGtiZml4amtwcG93aHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTg3NzMsImV4cCI6MjA5Mzg3NDc3M30.8Z9WJ_HPY2MS_LKFol2bZ2MAYzlqCpR9E0oV4oOV5Ew'

let vapidConfigured = false

export function getServerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    FALLBACK_ANON_KEY

  return createClient(url, key, { auth: { persistSession: false } })
}

export function ensureVapid() {
  if (vapidConfigured) return

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!publicKey || !privateKey) {
    throw new Error('Chaves VAPID não configuradas')
  }

  webpush.setVapidDetails(VAPID_CONTACT, publicKey, privateKey)
  vapidConfigured = true
}

export interface StoredSubscription {
  id: number | string
  endpoint: string
  p256dh: string
  auth: string
}

export interface SendResult {
  enviadas: number
  expiradas: number
  falhas: { id: number | string; status?: number; message: string }[]
}

// urgency 'high' faz o Android (Doze) e o iOS entregarem na hora, mesmo com o aparelho
// parado ou em economia de bateria. TTL de 3 dias: se o aparelho estiver desligado/offline,
// o serviço de push (FCM/APNs/Mozilla) guarda a mensagem e entrega assim que ele voltar.
const PUSH_TTL_SECONDS = 3 * 24 * 60 * 60
const PUSH_TIMEOUT_MS = 10_000
const MAX_ATTEMPTS = 4

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Erros temporários (rede, 429 e 5xx) merecem nova tentativa; 400/401/403 não.
function isRetryable(status?: number) {
  return status === undefined || status === 429 || status >= 500
}

function extractTopic(payload: string) {
  try {
    const tag = JSON.parse(payload)?.tag
    return typeof tag === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(tag) ? tag : undefined
  } catch {
    return undefined
  }
}

async function sendWithRetry(sub: StoredSubscription, payload: string) {
  const topic = extractTopic(payload)
  let lastError: any

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: PUSH_TTL_SECONDS, urgency: 'high', topic, timeout: PUSH_TIMEOUT_MS }
      )
      return
    } catch (err: any) {
      lastError = err
      if (!isRetryable(err?.statusCode) || attempt === MAX_ATTEMPTS) break

      // 429 respeita o Retry-After do serviço de push; senão backoff exponencial (1s, 2s, 4s).
      const retryAfter = Number(err?.headers?.['retry-after'])
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 8000)
        : 1000 * 2 ** (attempt - 1)
      await sleep(waitMs)
    }
  }

  throw lastError
}

// Envia o mesmo payload para TODAS as inscrições recebidas, com novas tentativas automáticas.
// Só 404/410 (inscrição realmente morta) apagam a inscrição; falhas temporárias nunca apagam.
export async function sendToSubscriptions(
  supabase: SupabaseClient,
  subs: StoredSubscription[],
  payload: string
): Promise<SendResult> {
  ensureVapid()

  const result: SendResult = { enviadas: 0, expiradas: 0, falhas: [] }

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await sendWithRetry(sub, payload)
        result.enviadas++
      } catch (err: any) {
        const status = err?.statusCode
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          result.expiradas++
        } else {
          console.error('[push] falha definitiva', { id: sub.id, status, message: err?.message })
          result.falhas.push({ id: sub.id, status, message: err?.message || 'erro desconhecido' })
        }
      }
    })
  )

  return result
}

// Executa tarefas com no máximo `limit` em paralelo (o cron tem milhares de utilizadores).
export async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let next = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]
      await worker(item)
    }
  })
  await Promise.all(runners)
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}
