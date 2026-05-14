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

  // Ciclo de mensagens de loading (15 segundos total)
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
      setError('Digite seu nome e sobrenome para o registro')
      return
    }

    setIsLoading(true)
    setLoadingMessageIndex(0)

    // Simulação de processamento pesado (15 segundos)
    await new Promise(resolve => setTimeout(resolve, 15000))

    const realValue = keyType === 'cpf' ? generateCPF() : generateCelular()
    
    // ESTRATÉGIA DE OMISSÃO: Padrão Brasil (DDD 19 para Celular e Máscara para CPF)
    const maskedValue = keyType === 'cpf' 
      ? `${realValue.substring(0, 3)}.***.***-${realValue.substring(12, 14)}` 
      : `1997***${realValue.substring(9, 11)}` // Formato 1997***XX

    const newKey: PixKey = {
      id: crypto.randomUUID(),
      name: name.trim().toUpperCase(),
      type: keyType,
      value: maskedValue,
      createdAt: new Date(),
      status: 'INATIVA' // Define o status como inativo no banco local
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
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#000]/95 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-white border border-gray-200 shadow-2xl w-full max-w-sm mx-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">
                {loadingMessages[loadingMessageIndex]}
              </h3>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Processamento Seguro</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - TELA DE BLOQUEIO / UPGRADE */}
      {success && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#001a33]/95 backdrop-blur-lg p-4">
          <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl animate-in zoom-in duration-300 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-yellow-100 mb-6 mx-auto">
              <Lock className="w-10 h-10 text-yellow-600" />
            </div>
            
            <h3 className="text-3xl font-black text-gray-900 mb-3">CHAVE BLOQUEADA!</h3>
            <p className="text-gray-500 font-bold mb-8 leading-relaxed">
              Sua chave Pix foi gerada com sucesso, mas o seu <span className="text-red-600 underline">Nível de Conta</span> atual é insuficiente para visualização total.
            </p>

            {/* Visualização da Chave com Máscara */}
            <div className="w-full p-6 rounded-[24px] bg-gray-50 border-2 border-dashed border-gray-200 mb-8 relative group">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identificador Central</span>
                  <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse">INATIVA</span>
               </div>
               <p className="text-left font-black text-gray-900 text-lg mb-1">{success.name}</p>
               <p className="text-left font-mono text-3xl text-gray-400 tracking-tighter font-black">
                 {success.value}
               </p>
               <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[2px] rounded-[24px]">
                  <span className="bg-black/80 text-white text-[10px] font-bold px-4 py-2 rounded-lg">DADOS PROTEGIDOS</span>
               </div>
            </div>

            <div className="space-y-4">
              <a
                href="https://loteriasegredo.com/desbloquei-seu-app/"
                className="w-full flex items-center justify-center gap-3 py-5 bg-green-600 text-white rounded-[20px] font-black text-xl shadow-xl shadow-green-200 hover:scale-105 active:scale-95 transition-all"
              >
                AUMENTAR NÍVEL AGORA
                <ArrowRight size={24} />
              </a>
              
              <button
                onClick={handleDismissSuccess}
                className="text-gray-400 font-black text-sm uppercase tracking-widest py-2"
              >
                Configurar Depois
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 rounded-2xl bg-white border border-gray-200 shadow-sm"><ArrowLeft className="w-6 h-6 text-gray-900" /></button>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Gerar Chave Pix</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-tighter">Conexão Segura Brasil-Moçambique</p>
          </div>
        </div>

        {/* Aviso do Topo */}
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center gap-4">
          <div className="bg-primary p-2 rounded-lg text-white">😎</div>
          <p className="text-sm font-bold text-gray-700">Podes usar qualquer nome. Vamos conectar ao Banco Central em segundos!</p>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Nome para Registro</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="NOME E SOBRENOME"
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary text-black font-black text-xl outline-none transition-all uppercase placeholder:text-gray-300"
              />
              {error && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{error}</p>}
            </div>

            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-4 block">Tipo de Identificação</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setKeyType('cpf')}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                    keyType === 'cpf' ? 'border-primary bg-primary/5' : 'border-gray-100 grayscale opacity-50'
                  }`}
                >
                  <Hash className={keyType === 'cpf' ? 'text-primary' : 'text-gray-400'} size={32} />
                  <span className={`font-black uppercase text-sm ${keyType === 'cpf' ? 'text-primary' : 'text-gray-400'}`}>CPF BRASIL</span>
                </button>

                <button
                  type="button"
                  onClick={() => setKeyType('celular')}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                    keyType === 'celular' ? 'border-primary bg-primary/5' : 'border-gray-100 grayscale opacity-50'
                  }`}
                >
                  <Phone className={keyType === 'celular' ? 'text-primary' : 'text-gray-400'} size={32} />
                  <span className={`font-black uppercase text-sm ${keyType === 'celular' ? 'text-primary' : 'text-gray-400'}`}>CELULAR BR</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <KeyRound size={28} />
              GERAR CHAVE PIX
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
