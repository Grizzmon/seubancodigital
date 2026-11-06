import { NextResponse } from 'next/server'
import type { Session, User } from '@supabase/supabase-js'
import { getServerSupabase } from './push-server'

export function normalizeAccountPhone(value: unknown): string {
  const digits = typeof value === 'string' ? value.replace(/\D/g, '') : ''
  return digits.startsWith('258') && digits.length === 12 ? digits.slice(3) : digits
}

// Internal address only. No email or SMS is sent by the classroom prototype.
export const schoolLoginEmail = (phone: string) => `phone-${phone}@accounts.realpayz.invalid`

function readCookie(request: Request, name: string) {
  const pair = (request.headers.get('cookie') || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(name + '='))
  try { return pair ? decodeURIComponent(pair.slice(name.length + 1)) : '' } catch { return '' }
}

export function setSchoolCookies(response: NextResponse, session: Session | null) {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' }
  response.cookies.set('realpayz_access', session?.access_token || '', { ...options, maxAge: session ? session.expires_in : 0 })
  response.cookies.set('realpayz_refresh', session?.refresh_token || '', { ...options, maxAge: session ? 30 * 86400 : 0 })
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function schoolIdentity(request: Request): Promise<{ user: User | null; refreshed: Session | null }> {
  const supabase = getServerSupabase()
  const access = readCookie(request, 'realpayz_access')
  if (access) {
    const { data, error } = await supabase.auth.getUser(access)
    if (!error && data.user) return { user: data.user, refreshed: null }
  }
  const refresh = readCookie(request, 'realpayz_refresh')
  if (refresh) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refresh })
    if (!error && data.user && data.session) return { user: data.user, refreshed: data.session }
  }
  return { user: null, refreshed: null }
}

export function validSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

export async function revokeSchoolSession(request: Request) {
  const access = readCookie(request, 'realpayz_access')
  if (access) await getServerSupabase().auth.admin.signOut(access, 'local').catch(() => {})
}
