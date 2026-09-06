import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/push-server'

// Cria (ou reaproveita) o usuário em bankpix_users a partir do telefone.
// Centraliza a escrita no servidor para que o schema real da tabela seja respeitado
// e para evitar contas duplicadas para o mesmo telefone.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : ''
    const phone = typeof body?.phone === 'string' ? body.phone.replace(/\D/g, '').slice(0, 20) : ''
    const accessType = body?.accessType === 'VIP' ? 'VIP' : 'FREE'

    if (!phone) {
      return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: existing, error: findError } = await supabase
      .from('bankpix_users')
      .select('id, name, access_type, created_at')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)

    if (findError) {
      return NextResponse.json(
        { error: 'Erro ao consultar usuário', details: findError.message },
        { status: 500 }
      )
    }

    if (existing && existing.length > 0) {
      const user = existing[0]

      const updates: Record<string, string> = {}
      if (name && name !== user.name) updates.name = name
      if (accessType === 'VIP' && user.access_type !== 'VIP') updates.access_type = 'VIP'

      if (Object.keys(updates).length > 0) {
        await supabase.from('bankpix_users').update(updates).eq('id', user.id)
      }

      return NextResponse.json({ success: true, userId: user.id, created: false })
    }

    const { data: inserted, error: insertError } = await supabase
      .from('bankpix_users')
      .insert({ name: name || 'Cliente', phone, access_type: accessType })
      .select('id')
      .single()

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário', details: insertError?.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, userId: inserted.id, created: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno', details: error?.message }, { status: 500 })
  }
}
