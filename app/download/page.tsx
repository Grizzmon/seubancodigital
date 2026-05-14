'use client'

import { useState, useEffect } from 'react'
import { Download, Smartphone, CheckCircle, ExternalLink } from 'lucide-react'

type Stage = 'landing' | 'preparing' | 'downloading' | 'complete'

export default function DownloadPage() {
  const [stage, setStage] = useState<Stage>('landing')
  const [progress, setProgress] = useState(0)

  const handleDownload = async () => {
    setStage('preparing')
    
    // Wait 5 seconds for "preparing"
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    setStage('downloading')
    setProgress(0)
  }

  // Progress animation for 10 seconds
  useEffect(() => {
    if (stage === 'downloading') {
      const duration = 10000 // 10 seconds
      const interval = 50 // Update every 50ms
      const increment = 100 / (duration / interval)
      
      const timer = setInterval(() => {
        setProgress(prev => {
          const next = prev + increment
          if (next >= 100) {
            clearInterval(timer)
            setStage('complete')
            return 100
          }
          return next
        })
      }, interval)

      return () => clearInterval(timer)
    }
  }, [stage])

  const handleOpen = () => {
    window.open('https://bankpix.vercel.app/', '_blank')
  }

  // Landing page
  if (stage === 'landing') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 text-center animate-fade-in">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/30">
                <span className="text-4xl font-bold text-primary-foreground">B</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">BankPix</h1>
              <p className="text-muted-foreground mt-1">Seu banco digital completo</p>
            </div>
          </div>

          {/* Features */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground text-lg">Baixar BankPix</h2>
            <p className="text-sm text-muted-foreground">
              Faca transacoes, receba pagamentos e gerencie suas financas de forma simples e segura.
            </p>
            
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Transferencias instantaneas via PIX</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Carteira digital segura</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Suporte 24/7</span>
              </li>
            </ul>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/25 active:scale-[0.98]"
          >
            <Download className="w-6 h-6" />
            Fazer Download
          </button>

          {/* Open Account Link */}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir conta agora
          </a>

          {/* Footer */}
          <p className="text-xs text-muted-foreground pt-4">
            Versao 2.4.1 - 48MB
          </p>
        </div>
      </div>
    )
  }

  // Preparing stage
  if (stage === 'preparing') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 text-center animate-fade-in">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/30 animate-pulse">
                <span className="text-5xl font-bold text-primary-foreground">B</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">BankPix</h1>
          </div>

          {/* Loading spinner */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">Preparando download...</p>
              <p className="text-sm text-muted-foreground mt-1">Aguarde um momento</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Downloading stage
  if (stage === 'downloading') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 text-center animate-fade-in">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/30">
                <span className="text-5xl font-bold text-primary-foreground">B</span>
              </div>
              {/* Animated download indicator */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">BankPix</h1>
          </div>

          {/* Progress section */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Baixando aplicativo...</span>
              <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
            </div>
            
            {/* Progress bar */}
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Download info */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress * 0.48)} MB / 48 MB</span>
              <span>Velocidade: 4.8 MB/s</span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Download className="w-4 h-4 animate-bounce" />
            <span className="text-sm">Download em andamento...</span>
          </div>
        </div>
      </div>
    )
  }

  // Complete stage
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center animate-fade-in">
        {/* Logo with success indicator */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/30">
              <span className="text-5xl font-bold text-primary-foreground">B</span>
            </div>
            {/* Success checkmark */}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">BankPix</h1>
        </div>

        {/* Success message */}
        <div className="bg-card border border-primary/30 rounded-2xl p-6 space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Download concluido!</span>
          </div>
          <p className="text-sm text-muted-foreground">
            O aplicativo BankPix foi baixado com sucesso. Clique no botao abaixo para abrir.
          </p>
        </div>

        {/* Open button */}
        <button
          onClick={handleOpen}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/25 active:scale-[0.98] animate-pulse-glow"
        >
          <ExternalLink className="w-6 h-6" />
          Abrir
        </button>

        {/* Additional info */}
        <p className="text-xs text-muted-foreground">
          Versao 2.4.1 instalada com sucesso
        </p>
      </div>
    </div>
  )
}
