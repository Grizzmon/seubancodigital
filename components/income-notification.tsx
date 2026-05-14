'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { formatBRL } from '@/lib/store'

interface IncomeNotificationProps {
  amount: number
  sender: string
  isVisible: boolean
  onClose: () => void
}

export function IncomeNotification({ amount, sender, isVisible, onClose }: IncomeNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      // Play notification sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQAHWrTr28NuAAhHoOP06r91AARBmt/8++yJBQM9m+H+/fCQCQU6mN/+/O+ODgc0kt78+uyKEAoyj9f69+iHFQ8viNT48+WCGBQrhM/38eSAGxcngcvy8uN/HRojfsXw8OF9IBwiez/w7+B7IyQhe8Pu7t94JiQhe8Pt7d52KCUge8Ts7N11KiYfe8Pr69x0LCcee8Lq6tp0LigdesHp6dl0MCkceMDo6Nh0Mikbd7/n59d0NCoad77m5tZ0NisbdrzkAAAA')
        audio.volume = 0.3
        audio.play().catch(() => {})
      } catch {
        // Audio not supported
      }
      
      // Auto-close after 6 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 6000)

      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
    }
  }, [isVisible, onClose])

  if (!isVisible && !isAnimating) return null

  return (
    <div 
      className={`fixed top-4 left-4 right-4 z-[100] max-w-md transition-all duration-500 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-full'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* BankPix Logo */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-black flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-emerald-400" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-base">
                PIX RECEBIDO
              </p>
              <p className="font-semibold text-emerald-600 text-lg">
                {formatBRL(amount)}
              </p>
              <p className="text-gray-500 text-sm mt-1 truncate">
                Voce recebeu um pix de {sender}...
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Fechar notificacao"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-emerald-500 animate-shrink-width"
            style={{ animationDuration: '6s' }}
          />
        </div>
      </div>
    </div>
  )
}
