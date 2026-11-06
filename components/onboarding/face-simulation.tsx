'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Check, LoaderCircle, UserRound } from 'lucide-react'
import { PrimaryButton } from './ui'

type Phase = 'ready' | 'scanning' | 'processing' | 'success'

// Live preview only: no canvas, photo, upload, or persistent image is created.
export function FaceSimulation({ onConfirm }: { onConfirm: () => void }) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mounted = useRef(true)

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; stopCamera() }
  }, [])

  useEffect(() => {
    if (phase !== 'scanning') return
    const timer = window.setTimeout(() => {
      stopCamera()
      setPhase('processing')
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'processing') return
    const timer = window.setTimeout(() => setPhase('success'), 8000)
    return () => window.clearTimeout(timer)
  }, [phase])

  async function begin(withCamera: boolean) {
    if (starting) return
    setStarting(true)
    setError('')
    if (withCamera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        if (!mounted.current) { stream.getTracks().forEach((track) => track.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch {
        if (mounted.current) {
          setError('A câmera não está disponível. Pode continuar a demonstração sem câmera.')
          setStarting(false)
        }
        return
      }
    }
    if (mounted.current) { setPhase('scanning'); setStarting(false) }
  }

  return (
    <section className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 py-10 text-center text-slate-900" aria-label="Simulação de validação facial">
      <span className="mb-5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600">Projeto escolar · simulação</span>
      <h1 className="text-2xl font-bold">{phase === 'success' ? 'Etapa concluída' : phase === 'processing' ? 'A processar…' : 'Posicione o rosto no oval'}</h1>
      <p className="mt-3 max-w-sm text-sm text-slate-500">Enquadre o rosto para continuar. A imagem é apenas uma pré-visualização e não é gravada nem enviada.</p>

      {phase === 'ready' || phase === 'scanning' ? (
        <div className="relative my-9 h-80 w-60 max-w-full overflow-hidden rounded-[50%] bg-slate-100 p-1.5">
          <div aria-hidden className={`absolute -inset-24 bg-[conic-gradient(from_0deg,#f43f5e,#8b5cf6,#06b6d4,#22c55e,#f43f5e)] ${phase === 'scanning' ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          <div className="relative h-full w-full overflow-hidden rounded-[50%] bg-slate-100">
            <UserRound aria-hidden className="absolute inset-0 m-auto h-36 w-36 text-slate-300" strokeWidth={1} />
            <video ref={videoRef} autoPlay playsInline muted className="relative h-full w-full -scale-x-100 object-cover" />
          </div>
        </div>
      ) : phase === 'processing' ? (
        <LoaderCircle className="my-16 h-20 w-20 animate-spin text-rose-500" aria-label="A processar" />
      ) : (
        <div className="my-12 flex h-32 w-32 items-center justify-center rounded-full bg-green-100 animate-pop-in">
          <Check className="h-20 w-20 text-green-600" strokeWidth={3} />
        </div>
      )}
      <p role="status" aria-live="polite" className="mb-6 text-sm text-slate-500">{phase === 'scanning' ? 'A capturar…' : phase === 'processing' ? 'A concluir a etapa…' : phase === 'success' ? 'Pode continuar o cadastro.' : error}</p>
      <div className="w-full max-w-sm">
        {phase === 'ready' ? <>
          <PrimaryButton disabled={starting} onClick={() => void begin(true)}><Camera className="h-5 w-5" /> {starting ? 'A abrir câmera…' : 'Confirmar identidade'}</PrimaryButton>
          {error && <button type="button" onClick={() => void begin(false)} className="mt-4 text-sm font-medium text-rose-600">Continuar sem câmera</button>}
        </> : phase === 'success' ? <PrimaryButton onClick={onConfirm}>Continuar</PrimaryButton> : null}
      </div>
    </section>
  )
}
