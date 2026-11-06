import { NextResponse } from 'next/server'

// Bulk broadcasts must not be triggered by a public GET request.
export async function GET() {
  return NextResponse.json({ error: 'Este endereço foi desativado. Os avisos são enviados pelo agendamento protegido.' }, { status: 410 })
}
