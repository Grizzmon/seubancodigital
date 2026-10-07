'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const PHOTOS = [
  { src: '/images/hero/corredora.png', alt: 'Mulher sorrindo enquanto corre ao ar livre' },
  { src: '/images/hero/medico.png', alt: 'Médico sorrindo no consultório' },
  { src: '/images/hero/cadeirante.png', alt: 'Mulher em cadeira de rodas a fazer exercício, sorrindo' },
  { src: '/images/hero/senhora-ativa.png', alt: 'Mulher sorrindo a fazer alongamento ao ar livre' },
]

const ROTATE_MS = 4500

export function HeroPhotos({ className }: { className?: string }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(Math.floor(Math.random() * PHOTOS.length))
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % PHOTOS.length), ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className={cn('absolute inset-0', className)}>
      {PHOTOS.map((photo, i) => (
        <Image
          key={photo.src}
          src={photo.src}
          alt={i === index ? photo.alt : ''}
          aria-hidden={i !== index}
          fill
          priority={i === 0}
          sizes="(max-width: 448px) 100vw, 448px"
          className={cn(
            'object-cover object-top transition-opacity duration-1000 ease-in-out',
            i === index ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
    </div>
  )
}
