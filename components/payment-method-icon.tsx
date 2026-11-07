import Image from 'next/image'
import type { PaymentPreference } from '@/lib/regional-settings'

export function PaymentMethodIcon({ method, size = 44 }: { method: PaymentPreference; size?: number }) {
  return method.logo
    ? <Image src={method.logo} alt={method.name} width={size} height={size} className="shrink-0 rounded-xl object-contain" style={{ width: size, height: size }} />
    : <span role="img" aria-label={method.name} className="flex shrink-0 items-center justify-center rounded-xl font-bold text-white" style={{ width: size, height: size, backgroundColor: method.color || '#773d91' }}>{method.monogram || method.name[0]}</span>
}
