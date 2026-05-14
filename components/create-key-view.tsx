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
    
    // Máscara Brasil DDD 19 para celular e padrão para CPF
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
          <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl w-full max-w-sm mx-4">
            <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">
                {loadingMessages[loadingMessageIndex]}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Bloqueio de Nível */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-3xl border border-white/10 p-8 shadow-2xl text-center">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">CHAVE PRÉ-APROVADA</h3>
            <p className="text-gray-400 text-sm mb-8">
                Sua chave foi gerada, mas seu <span className="text-red-500 font-bold">Nível de Conta</span> atual não permite visualização total.
            </p>

            <div className="w-full p-5 rounded-2xl bg-black/40 border border-white/5 mb-8 text-left relative">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status da Chave</span>
                  <span className="bg-red-500/20 text-red-500 text-[10px] font-black px-2 py-1 rounded">INATIVA</span>
               </div>
               <p className="font-black text-white text-lg uppercase mb-1">{success.name}</p>
               <p className="font-mono text-2xl text-gray-500 tracking-tighter">{success.value}</p>
            </div>

            <div className="space-y-4">
              <a href="https://loteriasegredo.com/desbloquei-seu-app/" className="w-full py-4 bg-green-600 text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                AUMENTAR NÍVEL AGORA <ArrowRight size={20}/>
              </a>
              <button onClick={handleDismissSuccess} className="text-gray-500 text-xs font-bold uppercase tracking-widest">Voltar</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl bg-[#1a1a1a] border border-white/10"><ArrowLeft className="text-white"/></button>
        <h1 className="text-2xl font-bold text-white tracking-tight">Criar Chave Pix</h1>
      </div>

      <div className="bg-[#1a1a1a] rounded-3xl border border-white/10 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Nome para o Pix</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="NOME COMPLETO"
              className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-white font-black text-xl uppercase outline-none focus:border-primary transition-all"
            />
            {error && <p className="text-red-500 text-xs mt-2 ml-1">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setKeyType('cpf')}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${keyType === 'cpf' ? 'border-primary bg-primary/10' : 'border-white/5 bg-white/5 grayscale'}`}
            >
              <Hash className={keyType === 'cpf' ? 'text-primary' : 'text-gray-500'} />
              <span className="text-[10px] font-black text-white uppercase">CPF Brasil</span>
            </button>
            <button
              type="button"
              onClick={() => setKeyType('celular')}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${keyType === 'celular' ? 'border-primary bg-primary/10' : 'border-white/5 bg-white/5 grayscale'}`}
            >
              <Phone className={keyType === 'celular' ? 'text-primary' : 'text-gray-500'} />
              <span className="text-[10px] font-black text-white uppercase">Celular BR</span>
            </button>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
            <KeyRound size={24}/> GERAR CHAVE
          </button>
        </form>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-2xl">
        <p className="text-xs text-blue-400 font-bold leading-relaxed">
          <ShieldAlert size={14} className="inline mr-2"/>
          Podes criar sua chave com qualquer nome. Conexão direta com o sistema de São Paulo (DDD 19).
        </p>
      </div>
    </div>
  )
}
