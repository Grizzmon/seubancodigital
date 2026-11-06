import type { StoredUser } from './stored-user'
import { saveStoredUser } from './stored-user'
import { notifyUserReady } from '@/components/service-worker-register'

export async function accessSchoolAccount(phone: string, password: string, legacy?: StoredUser, signup = false): Promise<StoredUser> {
  async function call(action: string) {
    return fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, phone, password, ...(action === 'signup' && legacy ? { profile: {
        name: legacy.name, countryCode: legacy.countryCode, incomeCurrency: legacy.incomeCurrency,
        wallets: legacy.wallets, regionType: legacy.regionType,
      } } : {}) }) })
  }
  let response = await call(signup ? 'signup' : 'login')
  // Old versions kept completed accounts on this device only. Migrate only
  // after the PIN has matched that saved account; never overwrite a cloud account.
  if (!signup && response.status === 401 && legacy?.password === password) {
    response = await call('signup')
    if (response.status === 409) response = await call('login')
  }
  const result = await response.json().catch(() => null)
  if (!response.ok || !result?.user) throw new Error(result?.error || 'Não foi possível entrar. Tente novamente.')
  const user: StoredUser = { ...result.user, ...(legacy || {}), name: result.user.name, phone: result.user.phone, password: '' }
  saveStoredUser(user)
  if (result.userId) {
    localStorage.setItem('bankpix_user_id_phone', user.phone)
    notifyUserReady({ userId: result.userId, newAccount: signup })
  }
  return user
}
