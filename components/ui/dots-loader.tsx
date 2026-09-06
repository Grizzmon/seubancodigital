import { cn } from '@/lib/utils'

interface DotsLoaderProps {
  className?: string
  // Tamanho de cada ponto em px.
  size?: number
  label?: string
}

// Três pontos que crescem em sequência (1 → 2 → 3) e repetem.
export function DotsLoader({ className, size = 12, label = 'Carregando' }: DotsLoaderProps) {
  return (
    <span role="status" aria-label={label} className={cn('flex items-center justify-center gap-[0.6em]', className)} style={{ fontSize: size }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="block rounded-full bg-current animate-dot-grow"
          style={{ width: size, height: size, animationDelay: `${i * 0.22}s` }}
        />
      ))}
    </span>
  )
}
