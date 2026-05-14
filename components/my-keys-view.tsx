'use client'

import { useState, useEffect } from 'react'
import { KeyRound, CheckCircle, Hash, Phone, ArrowLeft, Copy, Check, Lock, ShieldAlert, ArrowRight } from 'lucide-react'
import { type PixKey, generateCPF, generateCelular } from '@/lib/store'

interface CreateKeyViewProps {
  userName: string
  onAddKey: (key: PixKey) => void
  onBack: () => void
}

type KeyType = 'cpf' | 'celular'

const loadingMessages = [
  'Conectando ao servidor de São Paulo (DDD 19)...',
  'Gerando sua chave criptografada...',
  'Ligando com o Banco Central do Brasil...',
  'Validando informações de segurança...',
  'Não saia do app, quase pronto...',
  'Finalizando registro oficial...'
]

export function CreateKeyView({ userName, onAddKey, onBack }: CreateKeyViewProps) {
  const [name, setName] = useState('')
  const [keyType, setKeyType] = useState<KeyType>('cpf')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [success, setSuccess] = useState<{ name: string; value: string; type: KeyType } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length)
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || name.trim().split(/\s+/).length < 2) {
      setError('Digite nome e sobrenome')
      return
    }

    setIsLoading(true)
    setLoadingMessageIndex(0)

    await new Promise(resolve => setTimeout(resolve, 15000))

    const realValue = keyType === 'cpf' ? generateCPF() : generateCelular()
    
    // Lógica de Omissão para o formato solicitado
    let maskedValue = ""
    if (keyType === 'cpf') {
        maskedValue = `${realValue.substring(0, 3)}.***.***-${realValue.substring(12, 14)}`
    } else {
        maskedValue = `1997***${realValue.substring(9, 11)}`
    }

    const newKey: PixKey = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim().toUpperCase(),
      type: keyType,
      value: maskedValue,
      createdAt: new Date()
    }

    onAddKey(newKey)
    setIsLoading(false)
    setSuccess({ name: name.trim().toUpperCase(), value: maskedValue, type: keyType })
  }

  const handleDismissSuccess = () => {
    setSuccess(null)
    onBack()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl w-full max-w-sm mx-4 text-center">
            <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">
              {loadingMessages[loadingMessageIndex]}
            </h3>
          </div>
        </div>
      )}

      {/* Success Modal - Formato de Comprovante Bloqueado */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 text-center">
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-[32px] border border-white/10 p-8 shadow-2xl">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-yellow-500" />
            </div>
            
            <h3 className="text-2xl font-black text-white mb-2 uppercase italic">Chave Pré-Gerada!</h3>
            <p className="text-gray-400 text-xs font-bold mb-6 uppercase tracking-widest">Aguardando Ativação de Nível</p>

            {/* BOX DO COMPROVANTE (Formato solicitado) */}
            <div className="w-full p-6 rounded-2xl bg-black/40 border border-white/5 mb-8 text-left space-y-3">
               <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase">Titular:</p>
                  <p className="font-black text-white text-lg uppercase leading-tight">{success.name}</p>
               </div>
               
               <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase">
                    Chave Pix {success.type === 'cpf' ? 'CPF' : 'Celular'}:
                  </p>
                  <p className="font-mono text-2xl text-gray-500 font-black tracking-tighter leading-tight">
                    {success.value}
                  </p>
               </div>

               <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase">Banco:</p>
                  <p className="font-black text-primary text-lg">BANKPIX MZN</p>
               </div>

               <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-500 uppercase">Status:</span>
                  <span className="bg-red-500/20 text-red-500 text-[10px] font-black px-2 py-0.5 rounded animate-pulse">INATIVA</span>
               </div>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20 mb-2">
                <p className="text-[11px] text-yellow-500 font-bold leading-relaxed">
                  Esta chave está temporariamente bloqueada. Para desbloquear e começar a receber valores agora, ative sua licença de uso.
                </p>
              </div>

              <a href="https://loteriasegredo.com/desbloquei-seu-app/" className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 active:scale-95 transition-all">
                DESBLOQUEAR CHAVE PIX <ArrowRight size={22}/>
              </a>
              
              <button onClick={handleDismissSuccess} className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-gray-300 transition-colors">Configurar Depois</button>
            </div>
          </div>
        </div>
      )}

      {/* Main View */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 rounded-2xl bg-[#1a1a1a] border border-white/10 hover:bg-white/5 transition-all">
          <ArrowLeft className="text-white" size={24}/>
        </button>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-white tracking-tighter">Gerar Chave Pix</h1>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Conexão Segura</span>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-[32px] border border-white/10 p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">Nome para o Registro</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="NOME COMPLETO"
              className="w-full p-5 bg-black/40 border-2 border-transparent focus:border-primary rounded-2xl text-white font-black text-2xl uppercase outline-none transition-all placeholder:text-gray-800"
            />
            {error && <p className="text-red-500 text-xs font-black mt-2 ml-1">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setKeyType('cpf')}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                keyType === 'cpf' ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5 grayscale opacity-40'
              }`}
            >
              <Hash className={keyType === 'cpf' ? 'text-primary' : 'text-gray-500'} size={28} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">CPF Brasil</span>
            </button>
            
            <button
              type="button"
              onClick={() => setKeyType('celular')}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                keyType === 'celular' ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5 grayscale opacity-40'
              }`}
            >
              <Phone className={keyType === 'celular' ? 'text-primary' : 'text-gray-500'} size={28} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Celular BR</span>
            </button>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-6 bg-primary text-white rounded-[24px] font-black text-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
            <KeyRound size={28}/> GERAR CHAVE
          </button>
        </form>
      </div>

      <div className="bg-blue-900/10 border border-blue-500/20 p-5 rounded-3xl flex items-start gap-4">
        <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">😎</div>
        <p className="text-[11px] text-blue-400 font-bold leading-relaxed uppercase tracking-tighter">
          Podes usar qualquer nome. Chaves geradas com este sistema estão ligadas ao servidor central de São Paulo (DDD 19).
        </p>
      </div>
    </div>
  )
}
