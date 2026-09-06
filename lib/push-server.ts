import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'

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

  webpush.setVapidDetails('mailto:suporte@bankpix.com', publicKey, privateKey)
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

// Envia o mesmo payload para TODAS as inscrições recebidas.
// Inscrições expiradas (404/410) são removidas do banco para não travar envios futuros.
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
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        result.enviadas++
      } catch (err: any) {
        const status = err?.statusCode
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          result.expiradas++
        } else {
          result.falhas.push({ id: sub.id, status, message: err?.message || 'erro desconhecido' })
        }
      }
    })
  )

  return result
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}
