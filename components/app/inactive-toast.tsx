'use client'

import { useEffect, useState, useCallback } from 'react'
import { Lock } from 'lucide-react'

export function useInactiveToast() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 2200)
    return () => clearTimeout(timer)
  }, [message])

  const notify = useCallback((feature: string) => {
    setMessage(`${feature} estará disponível em breve.`)
  }, [])

  return { message, notify }
}

export function InactiveToast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6 animate-slide-up"
    >
      <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background shadow-xl">
        <Lock className="h-4 w-4" />
        {message}
      </div>
    </div>
  )
}
