import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, endpoint, p256dh, auth } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 1. Salvar na tabela push_subscriptions
    const response = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey!,
        'Authorization': `Bearer ${supabaseAnonKey!}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id,
        endpoint,
        p256dh,
        auth
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao salvar subscription no Supabase');
    }

    // 2. Atualizar o usuário para marcar push_enabled = true
    await fetch(`${supabaseUrl}/rest/v1/bankpix_users?id=eq.${user_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey!,
        'Authorization': `Bearer ${supabaseAnonKey!}`,
      },
      body: JSON.stringify({
        push_enabled: true
      })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na API save-subscription:', error);
    return NextResponse.json({ error: 'Falha ao processar subscription' }, { status: 500 });
  }
}
