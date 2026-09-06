import { notifyUserReady } from '@/components/service-worker-register'

interface RegisterUserInput {
  name: string
  phone: string
  accessType: 'FREE' | 'VIP'
  newAccount: boolean
}

// Cria/recupera o usuário no servidor e avisa o módulo de push
// para vincular a inscrição (e disparar boas-vindas quando for conta nova).
export async function registerUserAndLinkPush({
  name,
  phone,
  accessType,
  newAccount,
}: RegisterUserInput): Promise<string | null> {
  try {
    const res = await fetch('/api/register-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, accessType }),
    })

    if (!res.ok) {
      console.error('[register] falha ao salvar usuário:', await res.text())
      return null
    }

    const data = await res.json()
    const userId: string | undefined = data?.userId
    if (!userId) return null

    notifyUserReady({ userId, newAccount: newAccount || data?.created === true })

    return userId
  } catch (error) {
    console.error('[register] erro:', error)
    return null
  }
}
