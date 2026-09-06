'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, XCircle, RefreshCw, ImageUp } from 'lucide-react'
import { PrimaryButton, GhostButton } from './ui'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'capturing' | 'analyzing' | 'success' | 'error'

interface DocumentCaptureProps {
  side: 'frente' | 'verso'
  onConfirm: () => void
}

// Preview da câmera com máscara 9x6 para alinhar o documento.
// A validação da foto é simulada: falhas ocasionais na primeira tentativa,
// sempre aprovada a partir da segunda para não travar o usuário.
export function DocumentCapture({ side, onConfirm }: DocumentCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraBlocked, setCameraBlocked] = useState(false)
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function start() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraBlocked(true)
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => undefined)
        }
        setCameraReady(true)
      } catch {
        setCameraBlocked(true)
      }
    }

    start()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const runValidation = (image: string) => {
    setSnapshot(image)
    setStatus('analyzing')
    const attempt = attempts + 1
    setAttempts(attempt)
    const approved = attempt > 1 || Math.random() > 0.3
    window.setTimeout(() => setStatus(approved ? 'success' : 'error'), 1800)
  }

  const takePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !cameraReady) return
    setStatus('capturing')
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')?.drawImage(video, 0, 0, width, height)
    runValidation(canvas.toDataURL('image/jpeg', 0.85))
  }

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => runValidation(String(reader.result))
    reader.readAsDataURL(file)
  }

  const retry = () => {
    setSnapshot(null)
    setStatus('idle')
  }

  const sideLabel = side === 'frente' ? 'FRENTE' : 'VERSO'

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl bg-foreground" style={{ aspectRatio: '3 / 4' }}>
        {snapshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={snapshot} alt={`Foto do ${side} do documento`} className="h-full w-full object-cover" />
        ) : (
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        )}

        {!cameraReady && !snapshot ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-background">
            <Camera className="h-10 w-10 opacity-70" />
            <p className="text-sm leading-relaxed opacity-80">
              {cameraBlocked
                ? 'Não conseguimos acessar a câmera. Envie uma foto da galeria.'
                : 'Ativando a câmera...'}
            </p>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div
            className={cn(
              'relative w-full rounded-2xl border-[3px] transition-colors duration-300',
              status === 'success'
                ? 'border-success'
                : status === 'error'
                  ? 'border-destructive'
                  : 'border-background/90',
            )}
            style={{ aspectRatio: '9 / 6', boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }}
          >
            {status === 'analyzing' ? (
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary-light shadow-[0_0_16px_2px_var(--primary-light)] animate-scan-line" />
            ) : null}
          </div>
        </div>

        {status === 'analyzing' ? (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-foreground/70 py-3 text-sm font-medium text-background">
            <RefreshCw className="h-4 w-4 animate-spin" /> Analisando legibilidade...
          </div>
        ) : null}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex min-h-20 flex-col justify-center">
        {status === 'success' ? (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-success/40 bg-success/10 px-4 py-3 animate-pop-in">
            <CheckCircle2 className="h-7 w-7 shrink-0 text-success" />
            <p className="font-semibold text-background">Foto feita com sucesso!</p>
          </div>
        ) : status === 'error' ? (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-destructive/40 bg-destructive/10 px-4 py-3 animate-pop-in">
            <XCircle className="h-7 w-7 shrink-0 text-destructive" />
            <p className="font-semibold text-background">Erro na foto. Tente novamente.</p>
          </div>
        ) : (
          <p className="text-center text-pretty text-background/70">
            Posicione {side === 'frente' ? 'a' : 'o'} <span className="font-semibold text-background">{sideLabel}</span> do
            seu documento dentro do retângulo.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {status === 'success' ? (
          <PrimaryButton onClick={onConfirm}>Continuar</PrimaryButton>
        ) : status === 'error' ? (
          <PrimaryButton onClick={retry}>
            <RefreshCw className="h-5 w-5" /> Refazer foto
          </PrimaryButton>
        ) : cameraBlocked ? (
          <label className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-gradient text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30">
            <ImageUp className="h-5 w-5" /> Enviar foto
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFilePicked} />
          </label>
        ) : (
          <PrimaryButton onClick={takePhoto} disabled={!cameraReady || status !== 'idle'}>
            <Camera className="h-5 w-5" /> Tirar foto
          </PrimaryButton>
        )}

        {status === 'success' ? (
          <GhostButton onClick={retry} className="text-background/80 hover:bg-background/10">
            Tirar outra
          </GhostButton>
        ) : null}
      </div>
    </div>
  )
}
