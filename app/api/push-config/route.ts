import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/push-server'
import { createECDH } from 'node:crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  let validKeys = false
  try {
    if (publicKey && privateKey) {
      const ecdh = createECDH('prime256v1')
      ecdh.setPrivateKey(Buffer.from(privateKey, 'base64url'))
      validKeys = ecdh.getPublicKey().toString('base64url') === publicKey.replace(/=+$/, '')
    }
  } catch { /* Report configuration failure without exposing private keys. */ }
  const database = []
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = getServerSupabase()
    for (const [table, columns] of [
      ['bankpix_users', 'id,name,phone,access_type,created_at,last_remarketing_sent_at'],
      ['push_subscriptions', 'id,user_id,endpoint,p256dh,auth'],
    ]) {
      // Read metadata only: never return accounts or subscription endpoints.
      const { error } = await supabase.from(table).select(columns).limit(0)
      database.push({ table, ok: !error, code: error?.code ?? null,
        // Schema errors contain column/table names, not user data or credentials.
        detail: error && ['42703', '42P01', 'PGRST204', 'PGRST205'].includes(error.code)
          ? error.message : error ? 'Falha de conexão ou autorização do banco de dados.' : null })
    }
  }
  const configured = validKeys && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) && database.every((check) => check.ok)
  return NextResponse.json({
    configured,
    database,
    publicKey: configured ? publicKey : null,
    error: configured ? null : 'O envio de notificações ainda não está configurado no servidor.',
  }, { headers: { 'Cache-Control': 'no-store' } })
}
