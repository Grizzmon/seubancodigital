'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DotsLoader } from '@/components/ui/dots-loader'
import { activateProPlan } from '@/lib/pro'
import { analytics } from '@/lib/analytics'

// Link VIP: marca o aparelho como plano Pro e segue para o app.
export default function VipPage() {
  const router = useRouter()

  useEffect(() => {
    activateProPlan()
    analytics.vipLinkOpened()
    router.replace('/')
  }, [router])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-brand-gradient px-6 text-primary-foreground">
      <DotsLoader size={14} className="text-primary-foreground" />
      <p className="text-center text-lg font-semibold">Ativando o modo Pro...</p>
    </div>
  )
}
