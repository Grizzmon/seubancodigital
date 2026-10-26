import { NextResponse } from 'next/server'
import { phoneCountry } from '@/lib/phone-country'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Vercel derives this header from the visitor IP. No raw IP is stored.
  const code = request.headers.get('x-vercel-ip-country')?.toUpperCase() ?? ''
  return NextResponse.json({ country: phoneCountry(code).code }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
