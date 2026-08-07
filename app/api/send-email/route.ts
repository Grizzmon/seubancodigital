import { NextResponse } from 'next/server'

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
  const recipient = process.env.NOTIFICATION_EMAIL

  if (!apiKey || !recipient) {
    return NextResponse.json(
      { error: 'Configuração do Resend ausente.' },
      { status: 500 },
    )
  }

  const data = await request.json()

  if (data.accessType !== 'VIP_UNLOCKED') {
    return NextResponse.json(
      { error: 'Acesso não autorizado.' },
      { status: 403 },
    )
  }

  const headers = request.headers

  const city = headers.get('x-vercel-ip-city')
  const region = headers.get('x-vercel-ip-region')
  const country = headers.get('x-vercel-ip-country')

  const location =
    [city, region, country]
      .filter(Boolean)
      .map((value) => escapeHtml(value as string))
      .join(', ') || 'Localização não identificada'

  const url = escapeHtml(
    String(data.url || 'Não informado').slice(0, 500),
  )

  const referrer = escapeHtml(
    String(data.referrer || 'Acesso direto').slice(0, 500),
  )

  const userAgent = escapeHtml(
    String(data.userAgent || 'Não informado').slice(0, 500),
  )

  const response = await fetch(
    'https://api.resend.com/emails',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [recipient],
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
            <strong>URL:</strong>
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
              Este email informa um acesso à área VIP.
              Como o pagamento ocorre em um link externo,
              o acesso não confirma uma compra.
            </small>
          </p>
        `,
      }),
    },
  )

  if (!response.ok) {
    const error = await response.text()

    console.error('Erro do Resend:', error)

    return NextResponse.json(
      { error: 'O Resend recusou o envio.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ sent: true })
}
