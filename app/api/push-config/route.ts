import { NextResponse } from 'next/server'
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
  const configured = validKeys && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  return NextResponse.json({
    configured,
    publicKey: configured ? publicKey : null,
    error: configured ? null : 'O envio de notificações ainda não está configurado no servidor.',
  }, { headers: { 'Cache-Control': 'no-store' } })
}
