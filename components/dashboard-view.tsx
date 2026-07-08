'use client'

import { useState } from 'react'
import { Wallet, Send, Smartphone, Eye, EyeOff, Lock, Plus, Settings, Bell, QrCode, Copy, Check, X, LogOut, CreditCard, Phone } from 'lucide-react'

export function DashboardView({ userData, onLogout }: { userData: any; onLogout: () => void }) {
  const [showBalance, setShowBalance] = useState(true)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showPixModal, setShowPixModal] = useState(false)
  const [pixStep, setPixStep] = useState<'menu' | 'add' | 'view'>('menu')
  const [pixKeys, setPixKeys] = useState<any[]>(JSON.parse(localStorage.getItem(`bankpix_keys_${userData.phone}`) || '[]'))
  const [newPixKey, setNewPixKey] = useState({ type: 'email', value: '' })
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [limitModalSource, setLimitModalSource] = useState<'pagar' | 'recarregar' | null>(null)

  const handleAddPixKey = () => {
    if (newPixKey.value.trim()) {
      const updatedKeys = [...pixKeys, { id: Date.now(), ...newPixKey }]
      setPixKeys(updatedKeys)
      localStorage.setItem(`bankpix_keys_${userData.phone}`, JSON.stringify(updatedKeys))
      setNewPixKey({ type: 'email', value: '' })
      setPixStep('view')
    }
  }

  const handleDeletePixKey = (id: number) => {
    const updatedKeys = pixKeys.filter(key => key.id !== id)
    setPixKeys(updatedKeys)
    localStorage.setItem(`bankpix_keys_${userData.phone}`, JSON.stringify(updatedKeys))
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const blockedFeature = (source: 'pagar' | 'recarregar') => {
    setLimitModalSource(source)
    setShowLimitModal(true)
  }

  const pixTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      email: '✉️ Email',
      cpf: '🔖 CPF',
      phone: '📱 Telefone',
      random: '🔐 Aleatória'
    }
    return labels[type] || type
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 antialiased">
      {/* Header Premium Azul */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white px-6 py-8 shadow-lg">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-2">Bem-vindo,</p>
            <h1 className="text-4xl font-black tracking-tight">{userData.name?.split(' ')[0] || 'Usuário'}</h1>
            <p className="text-blue-200 text-xs font-medium mt-1">Banco Digital Seguro</p>
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur transition-all">
              <Bell size={22} />
            </button>
            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur transition-all">
              <Settings size={22} />
            </button>
            <button onClick={onLogout} className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-2xl backdrop-blur transition-all border border-red-400/30">
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        
        {/* Cartão Premium Estilo Nubank */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-blue-500/20 backdrop-blur relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/15 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header do Cartão */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest">Saldo Disponível</p>
                <div className="flex items-center gap-4">
                  <h2 className="text-6xl font-black tracking-tight">
                    {showBalance ? `R$ ${userData.balance || '0,00'}` : '••••••'}
                  </h2>
                  <button onClick={() => setShowBalance(!showBalance)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all backdrop-blur">
                    {showBalance ? <Eye size={24} /> : <EyeOff size={24} />}
                  </button>
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur border border-white/10">
                <Wallet size={36} className="text-blue-300" />
              </div>
            </div>

            {/* Dados do Cartão */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-blue-500/30">
              <div>
                <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">Titular</p>
                <p className="text-2xl font-black text-white">{userData.name || 'Usuário'}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">Limite Diário</p>
                <p className="text-2xl font-black text-blue-300">R$ {userData.dailyLimit || '0,00'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação Premium */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest px-2">Funcionalidades</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Pix - Funcional */}
            <button 
              onClick={() => setShowPixModal(true)}
              className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-md hover:shadow-lg transition-all active:scale-95 border-2 border-blue-100 hover:border-blue-400 group"
            >
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform shadow-lg">
                <QrCode size={24} />
              </div>
              <p className="font-black text-blue-900 text-sm">Pix</p>
              <p className="text-blue-600 text-xs font-semibold mt-1">Enviar e receber</p>
            </button>

            {/* Pagar - Bloqueado */}
            <button 
              onClick={() => blockedFeature('pagar')}
              className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-md border-2 border-slate-200 hover:border-slate-300 transition-all opacity-70 relative group"
            >
              <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">Bloqueado</div>
              <div className="bg-gradient-to-br from-purple-400 to-pink-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg opacity-60">
                <CreditCard size={24} />
              </div>
              <p className="font-black text-slate-600 text-sm">Pagar</p>
              <p className="text-slate-500 text-xs font-semibold mt-1">Contas</p>
            </button>

            {/* Recarregar - Bloqueado */}
            <button 
              onClick={() => blockedFeature('recarregar')}
              className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-md border-2 border-slate-200 hover:border-slate-300 transition-all opacity-70 relative group"
            >
              <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">Bloqueado</div>
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg opacity-60">
                <Phone size={24} />
              </div>
              <p className="font-black text-slate-600 text-sm">Recarregar</p>
              <p className="text-slate-500 text-xs font-semibold mt-1">Celular</p>
            </button>
          </div>
        </div>

        {/* Informações Conta */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-blue-100 space-y-4">
          <h3 className="text-2xl font-black text-blue-900">Informações da Conta</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="pb-6 border-b-2 border-blue-100">
              <p className="text-blue-600 font-semibold text-sm mb-2">Telefone</p>
              <p className="text-xl font-black text-blue-900">+258 {userData.phone}</p>
            </div>
            <div className="pb-6 border-b-2 border-blue-100">
              <p className="text-blue-600 font-semibold text-sm mb-2">Data de Nascimento</p>
              <p className="text-xl font-black text-blue-900">{userData.birthDate}</p>
            </div>
            <div className="pb-6 border-b-2 border-blue-100">
              <p className="text-blue-600 font-semibold text-sm mb-2">Localização</p>
              <p className="text-xl font-black text-blue-900">{userData.province}</p>
            </div>
            <div className="pb-6 border-b-2 border-blue-100">
              <p className="text-blue-600 font-semibold text-sm mb-2">Limite Diário</p>
              <p className="text-xl font-black text-blue-900">R$ {userData.dailyLimit}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pix */}
      {showPixModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 flex justify-between items-center sticky top-0">
              <h2 className="text-3xl font-black">Área Pix</h2>
              <button onClick={() => { setShowPixModal(false); setPixStep('menu'); }} className="p-3 hover:bg-white/20 rounded-xl transition-all">
                <X size={28} />
              </button>
            </div>

            <div className="p-8">
              {/* Menu Inicial */}
              {pixStep === 'menu' && (
                <div className="space-y-4">
                  <button 
                    onClick={() => setPixStep('view')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl py-6 font-bold text-lg tracking-wide flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
                  >
                    <QrCode size={24} /> Ver Minhas Chaves Pix
                  </button>
                  <button 
                    onClick={() => setPixStep('add')}
                    className="w-full bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-3xl py-6 font-bold text-lg tracking-wide flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
                  >
                    <Plus size={24} /> Adicionar Nova Chave
                  </button>
                </div>
              )}

              {/* Adicionar Chave */}
              {pixStep === 'add' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-2xl font-black text-blue-900">Nova Chave Pix</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-blue-900 font-bold mb-3">Tipo de Chave</label>
                      <select 
                        value={newPixKey.type}
                        onChange={(e) => setNewPixKey({ ...newPixKey, type: e.target.value })}
                        className="w-full p-4 border-2 border-blue-200 focus:border-blue-600 rounded-2xl font-semibold text-blue-900 outline-none transition-all bg-blue-50"
                      >
                        <option value="email">✉️ Email</option>
                        <option value="cpf">🔖 CPF</option>
                        <option value="phone">📱 Telefone</option>
                        <option value="random">🔐 Chave Aleatória</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-blue-900 font-bold mb-3">
                        {newPixKey.type === 'random' ? 'Gerar Chave' : 'Seu ' + newPixKey.type.charAt(0).toUpperCase() + newPixKey.type.slice(1)}
                      </label>
                      {newPixKey.type === 'random' ? (
                        <button 
                          onClick={() => setNewPixKey({ ...newPixKey, value: Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15) })}
                          className="w-full p-4 border-2 border-dashed border-blue-400 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition-all"
                        >
                          Gerar Aleatória
                        </button>
                      ) : (
                        <input 
                          type="text"
                          placeholder={newPixKey.type === 'email' ? 'seu@email.com' : newPixKey.type === 'cpf' ? '00000000000' : '84900000000'}
                          value={newPixKey.value}
                          onChange={(e) => setNewPixKey({ ...newPixKey, value: e.target.value })}
                          className="w-full p-4 border-2 border-blue-200 focus:border-blue-600 rounded-2xl font-semibold text-blue-900 outline-none transition-all bg-blue-50"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setPixStep('menu')}
                      className="flex-1 p-4 border-2 border-blue-600 text-blue-600 rounded-2xl font-bold transition-all hover:bg-blue-50"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={handleAddPixKey}
                      disabled={!newPixKey.value}
                      className="flex-1 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}

              {/* Ver Chaves */}
              {pixStep === 'view' && (
                <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                  <h3 className="text-2xl font-black text-blue-900 mb-6">Suas Chaves Pix</h3>
                  
                  {pixKeys.length === 0 ? (
                    <div className="text-center py-12 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-300">
                      <p className="text-blue-600 font-bold text-lg mb-4">Nenhuma chave registrada</p>
                      <button 
                        onClick={() => setPixStep('add')}
                        className="inline-block px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
                      >
                        Adicionar Agora
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pixKeys.map((key) => (
                        <div key={key.id} className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 flex justify-between items-center hover:border-blue-400 transition-all">
                          <div className="flex-1">
                            <p className="text-blue-600 font-semibold text-sm">{pixTypeLabel(key.type)}</p>
                            <p className="text-blue-900 font-black text-lg mt-1">{key.value}</p>
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => handleCopyKey(key.value)}
                              className="p-3 bg-white border-2 border-blue-300 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                            >
                              {copiedKey === key.value ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                            </button>
                            <button 
                              onClick={() => handleDeletePixKey(key.id)}
                              className="p-3 bg-white border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    onClick={() => setPixStep('menu')}
                    className="w-full mt-6 p-4 bg-blue-600 text-white rounded-2xl font-bold transition-all hover:bg-blue-700 active:scale-95"
                  >
                    Voltar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Limite Desbloqueado */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center text-white mx-auto">
              <Lock size={40} />
            </div>

            <div>
              <h2 className="text-3xl font-black text-blue-900 mb-2">Função Bloqueada</h2>
              <p className="text-blue-600 font-semibold">
                {limitModalSource === 'pagar' ? 'Pagamento de contas' : 'Recarga de celular'} está disponível apenas para contas com limite aumentado.
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 text-left space-y-3">
              <p className="text-blue-900 font-bold">Ao desbloquear você terá acesso a:</p>
              <ul className="space-y-2 text-blue-700 font-semibold text-sm">
                <li>✓ Pagamento de contas</li>
                <li>✓ Recarga de celular</li>
                <li>✓ Transferências ilimitadas</li>
                <li>✓ Limite aumentado</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowLimitModal(false)}
                className="flex-1 p-4 border-2 border-blue-600 text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all"
              >
                Agora Não
              </button>
              <a 
                href="https://www.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95 flex items-center justify-center text-center"
              >
                Desbloquear AGORA!
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
