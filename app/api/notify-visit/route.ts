import { NextResponse } from 'next/server'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const SENDER_EMAIL = 'onboarding@resend.dev'

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }

    return entities[character]
  })
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY

  const recipients = [
    process.env.NOTIFICATION_EMAIL,
    process.env.NOTIFICATION_EMAIL_2,
  ].filter(
    (email): email is string =>
      typeof email === 'string' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  )

  if (!apiKey || recipients.length === 0) {
    return NextResponse.json(
      {
        error:
          'RESEND_API_KEY ou email de destino não configurado.',
      },
      { status: 500 },
    )
  }

  let data: {
    pageType?: string
    url?: string
    referrer?: string
    userAgent?: string
  }

  try {
    data = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Dados inválidos.' },
      { status: 400 },
    )
  }

  if (data.pageType !== 'vip') {
    return NextResponse.json(
      { error: 'Notificação permitida somente para a área VIP.' },
      { status: 403 },
    )
  }

  const city = request.headers.get('x-vercel-ip-city')
  const region = request.headers.get('x-vercel-ip-region')
  const country = request.headers.get('x-vercel-ip-country')

  const location =
    [city, region, country]
      .filter(Boolean)
      .map((value) => escapeHtml(String(value)))
      .join(', ') || 'Localização não identificada'

  const url = escapeHtml(
    typeof data.url === 'string'
      ? data.url.slice(0, 500)
      : 'Não informado',
  )

  const referrer = escapeHtml(
    typeof data.referrer === 'string'
      ? data.referrer.slice(0, 500)
      : 'Acesso direto',
  )

  const userAgent = escapeHtml(
    typeof data.userAgent === 'string'
      ? data.userAgent.slice(0, 500)
      : 'Não informado',
  )

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: recipients,
        subject: 'Novo acesso à área VIP',
        html: `
          <h2>Novo acesso à área VIP</h2>

          <p>
            <strong>Data e hora:</strong>
            ${new Date().toLocaleString('pt-BR', {
              timeZone: 'Africa/Maputo',
            })}
          </p>

          <p>
            <strong>Localização aproximada:</strong>
            ${location}
          </p>

          <p>
            <strong>URL acessada:</strong>
            ${url}
          </p>

          <p>
            <strong>Origem:</strong>
            ${referrer}
          </p>

          <p>
            <strong>Navegador:</strong>
            ${userAgent}
          </p>

          <hr />

          <p>
            <small>
              Este é um alerta de acesso à área VIP.
              Como o pagamento ocorre em um link externo,
              este acesso não confirma uma compra.
            </small>
          </p>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.text()

      console.error('[v0] Erro do Resend:', error)

      return NextResponse.json(
        { error: 'O Resend recusou o envio.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error('[v0] Erro ao enviar email:', error)

    return NextResponse.json(
      { error: 'Falha no envio do email.' },
      { status: 502 },
    )
  }
}
