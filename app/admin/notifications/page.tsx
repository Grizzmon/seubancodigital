'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCircle2, Clock3, Loader2, RefreshCw, ShieldAlert, Users } from 'lucide-react'

 type QueueResponse = {
  totalSubscriptions: number
  eligibleCount: number
  rows: Array<{ id: string; user_id: string; name: string; created_at?: string }>
  generatedAt: string
}

export default function AdminNotificationsPage() {
  const [key, setKey] = useState('')
  const [data, setData] = useState<QueueResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async (adminKey: string) => {
    if (!adminKey) return
    setLoading(true)
    setError('')
    const response = await fetch(`/api/admin/notifications?key=${encodeURIComponent(adminKey)}`, { cache: 'no-store' })
    const result = await response.json()
    if (!response.ok) setError(result.error || 'Link secreto inválido.')
    else setData(result)
    setLoading(false)
  }, [])

  useEffect(() => {
    const initialKey = new URLSearchParams(window.location.search).get('key') || ''
    setKey(initialKey)
    if (initialKey) load(initialKey)
    else setLoading(false)
  }, [load])

  async function sendNotifications() {
    if (!key || !data?.eligibleCount || sending) return
    if (!window.confirm(`Enviar para ${data.eligibleCount} usuário(s) novo(s)?`)) return
    setSending(true)
    setMessage('')
    setError('')
    const response = await fetch(`/api/admin/notifications?key=${encodeURIComponent(key)}`, { method: 'POST' })
    const result = await response.json()
    if (!response.ok) setError(result.error || 'Não foi possível disparar.')
    else {
      setMessage(result.message)
      await load(key)
    }
    setSending(false)
  }

  if (!key) return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100"><div className="max-w-md text-center"><ShieldAlert className="mx-auto mb-5 size-12 text-amber-400" /><h1 className="text-2xl font-semibold">Painel protegido</h1><p className="mt-3 text-slate-400">Use o link administrativo completo para acessar este painel.</p></div></main>

  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-5 border-b border-slate-800 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="mb-3 flex items-center gap-2 text-sm font-medium text-cyan-300"><Bell className="size-4" /> Central de remarketing</div><h1 className="text-3xl font-semibold tracking-tight">Notificações Push</h1><p className="mt-2 text-slate-400">Acompanhe novos usuários e envie uma campanha quando desejar.</p></div>
        <button onClick={() => load(key)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-900" disabled={loading}><RefreshCw className="size-4" /> Atualizar</button>
      </header>
      {error && <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-200">{error}</div>}
      {message && <div className="flex items-center gap-2 rounded-xl border border-emerald-900/60 bg-emerald-950/30 p-4 text-sm text-emerald-200"><CheckCircle2 className="size-4" />{message}</div>}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Users className="mb-4 size-5 text-cyan-300" /><p className="text-sm text-slate-400">Subscriptions Push</p><p className="mt-2 text-3xl font-semibold">{data?.totalSubscriptions ?? '—'}</p></div>
        <div className="rounded-2xl border border-cyan-900/60 bg-cyan-950/20 p-5"><Bell className="mb-4 size-5 text-cyan-300" /><p className="text-sm text-slate-400">Novos para enviar</p><p className="mt-2 text-3xl font-semibold">{data?.eligibleCount ?? '—'}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><Clock3 className="mb-4 size-5 text-amber-300" /><p className="text-sm text-slate-400">Proteção anti-spam</p><p className="mt-2 text-lg font-semibold">2 horas por usuário</p></div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Fila de novos usuários</h2><p className="mt-1 text-sm text-slate-400">Depois do disparo, esta lista é atualizada automaticamente.</p></div><button onClick={sendNotifications} disabled={loading || sending || !data?.eligibleCount} className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">{sending && <Loader2 className="size-4 animate-spin" />} {sending ? 'Enviando...' : data?.eligibleCount ? `Disparar para ${data.eligibleCount}` : 'Nenhum usuário novo'}</button></div>
        {loading ? <div className="flex items-center gap-2 p-8 text-sm text-slate-400"><Loader2 className="size-4 animate-spin" /> Consultando usuários...</div> : data?.rows.length ? <div className="divide-y divide-slate-800">{data.rows.map((row) => <div key={row.id} className="flex items-center justify-between gap-4 p-5"><div><p className="font-medium">{row.name}</p><p className="mt-1 text-xs text-slate-500">ID: {row.user_id}</p></div><span className="rounded-full bg-cyan-950 px-3 py-1 text-xs text-cyan-300">Novo</span></div>)}</div> : <div className="p-10 text-center"><CheckCircle2 className="mx-auto mb-3 size-8 text-emerald-400" /><h3 className="font-medium">Tudo em dia</h3><p className="mt-1 text-sm text-slate-400">Novos usuários aparecerão aqui quando ativarem as notificações.</p></div>}
      </section>
      <p className="text-xs text-slate-600">Última atualização: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString('pt-BR') : '—'}</p>
    </div>
  </main>
}
