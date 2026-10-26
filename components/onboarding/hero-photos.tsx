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

const ROTATE_MS = 5000

export function HeroPhotos({ className }: { className?: string }) {
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState<boolean[]>([])
  const ready = loaded[index] === true

  useEffect(() => {
    if (!ready) return
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % PHOTOS.length), ROTATE_MS)
    return () => window.clearTimeout(timer)
  }, [index, ready])

  return (
    <div className={cn('absolute inset-0', className)}>
      <div className="absolute inset-x-6 top-3 z-20 flex gap-1.5" aria-label={`Imagem ${index + 1} de ${PHOTOS.length}`}>
        {PHOTOS.map((photo, i) => (
          <span key={photo.src} className="h-1 flex-1 overflow-hidden rounded-full bg-white/35">
            <span
              key={`${index}-${i}`}
              className="block h-full rounded-full bg-white"
              style={{
                width: i < index ? '100%' : '0%',
                animation: i === index && ready ? `hero-progress ${ROTATE_MS}ms linear forwards` : undefined,
              }}
            />
          </span>
        ))}
      </div>
      {PHOTOS.map((photo, i) => (
        <Image
          key={photo.src}
          onLoad={() => setLoaded((current) => { const next = [...current]; next[i] = true; return next })}
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
