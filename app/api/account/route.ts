import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/push-server'
import { normalizeAccountPhone, schoolLoginEmail, schoolIdentity, setSchoolCookies, validSameOrigin, revokeSchoolSession } from '@/lib/school-auth'

export const dynamic = 'force-dynamic'

function safeProfile(source: Record<string, unknown>, name: string, phone: string) {
  // Explicit allowlist: no password, document photo, facial image, or identity document fields.
  const profile: Record<string, unknown> = { name, phone, balance: 0, income: 0, keys: [], transactions: [] }
  for (const key of ['countryCode', 'incomeCurrency', 'wallets', 'regionType']) {
    if (source[key] !== undefined) profile[key] = source[key]
  }
  return profile
}

export async function GET(request: Request) {
  const identity = await schoolIdentity(request)
  if (!identity.user) return NextResponse.json({ authenticated: false }, { headers: { 'Cache-Control': 'no-store' } })
  const { data, error } = await getServerSupabase().from('school_accounts').select('name,phone,profile,bankpix_user_id').eq('auth_user_id', identity.user.id).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Não foi possível recuperar a conta.' }, { status: 503 })
  const response = NextResponse.json({ authenticated: true, user: { ...data.profile, name: data.name, phone: data.phone, password: '' }, userId: data.bankpix_user_id })
  if (identity.refreshed) return setSchoolCookies(response, identity.refreshed)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function POST(request: Request) {
  if (!validSameOrigin(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 })
  try {
    const body = await request.json().catch(() => null)
    if (body?.action === 'logout') {
      await revokeSchoolSession(request)
      return setSchoolCookies(NextResponse.json({ success: true }), null)
    }
    const phone = normalizeAccountPhone(body?.phone)
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!/^\d{9,12}$/.test(phone) || !/^\d{6}$/.test(password)) return NextResponse.json({ error: 'Verifique o número e a senha de 6 dígitos.' }, { status: 400 })
    const supabase = getServerSupabase()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    for (const [bucket, limit] of [[`phone:${phone}`, 12], [`ip:${ip}`, 60]] as const) {
      const { data, error } = await supabase.rpc('school_auth_allow', { p_bucket: createHash('sha256').update(bucket).digest('hex'), p_limit: limit })
      if (error) throw new Error('Não foi possível preparar o acesso.')
      if (!data) return NextResponse.json({ error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' }, { status: 429 })
    }
    const email = schoolLoginEmail(phone)
    const isSignup = body?.action === 'signup'
    if (isSignup) {
      const name = typeof body?.profile?.name === 'string' ? body.profile.name.trim().slice(0, 120) : ''
      if (!name) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })
      const { data: created, error: createError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
      if (createError || !created.user) return NextResponse.json({ error: 'Este número já pode ter uma conta. Entre com a senha usada no cadastro.' }, { status: 409 })
      const authId = created.user.id
      const { data: existing } = await supabase.from('bankpix_users').select('id').eq('phone', phone).order('created_at', { ascending: false }).limit(1)
      let bankId = existing?.[0]?.id
      if (!bankId) {
        const { data: bankUser, error } = await supabase.from('bankpix_users').insert({ name, phone, access_type: 'FREE' }).select('id').single()
        if (error || !bankUser) { await supabase.auth.admin.deleteUser(authId); throw new Error('Não foi possível guardar a conta.') }
        bankId = bankUser.id
      }
      const { error } = await supabase.from('school_accounts').insert({ auth_user_id: authId, phone, name, bankpix_user_id: bankId, profile: safeProfile(body.profile, name, phone) })
      if (error) { await supabase.auth.admin.deleteUser(authId); throw new Error('Não foi possível guardar o cadastro. Tente novamente.') }
    }
    // A separate client prevents signing in from changing the privileged data client.
    const authClient = getServerSupabase()
    const { data: login, error: loginError } = await authClient.auth.signInWithPassword({ email, password })
    if (loginError || !login.user || !login.session) return NextResponse.json({ error: 'Número ou senha incorretos. Verifique os dados do cadastro.' }, { status: 401 })
    const { data: account, error } = await getServerSupabase().from('school_accounts').select('name,phone,profile,bankpix_user_id').eq('auth_user_id', login.user.id).single()
    if (error || !account) throw new Error('Não foi possível recuperar os dados da conta.')
    return setSchoolCookies(NextResponse.json({ success: true, userId: account.bankpix_user_id,
      user: { ...account.profile, name: account.name, phone: account.phone, password: '' } }), login.session)
  } catch (error) {
    console.error('[school-account]', error instanceof Error ? error.message : 'Account error')
    return NextResponse.json({ error: 'Não foi possível concluir o acesso. Tente novamente.' }, { status: 503 })
  }
}
