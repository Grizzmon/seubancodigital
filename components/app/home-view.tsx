'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Bell,
  Eye,
  EyeOff,
  Search,
  ChevronRight,
  ArrowLeftRight,
  Barcode,
  CreditCard,
  CircleDollarSign,
  PieChart,
  CalendarDays,
  SlidersHorizontal,
  Home,
  ShoppingBag,
  User,
  LayoutGrid,
  Wallet,
  Globe,
  ShieldCheck,
} from 'lucide-react'
import { formatBRL, formatMZN, convertToMZN } from '@/lib/store'
import { capitalizeWords, firstName } from '@/lib/onboarding-format'
import { cn } from '@/lib/utils'
import { PixSymbol } from './pix-symbol'
import { InactiveToast, useInactiveToast } from './inactive-toast'

interface HomeViewProps {
  userName: string
  balance: number
  onOpenPix: () => void
  onOpenStatement: () => void
  onLogout: () => void
}

type Favorite = {
  id: string
  label: string
  icon: React.ReactNode
  active?: boolean
  highlight?: boolean
}

const BENEFITS = [
  {
    id: 'pix-internacional',
    title: 'Pix internacional',
    text: 'Receba do Brasil e levante em meticais na hora.',
    icon: <Globe className="h-6 w-6" />,
  },
  {
    id: 'carteiras',
    title: 'Carteiras móveis',
    text: 'M-Pesa, e-Mola e mKesh vinculadas à sua conta.',
    icon: <Wallet className="h-6 w-6" />,
  },
  {
    id: 'seguranca',
    title: 'Conta protegida',
    text: 'Senha de transação em todas as movimentações.',
    icon: <ShieldCheck className="h-6 w-6" />,
  },
]

export function HomeView({ userName, balance, onOpenPix, onOpenStatement, onLogout }: HomeViewProps) {
  const [showBalance, setShowBalance] = useState(true)
  const { message, notify } = useInactiveToast()

  const name = capitalizeWords(firstName(userName)) || 'Cliente'

  const favorites: Favorite[] = [
    { id: 'transfer', label: 'Transferências', icon: <ArrowLeftRight className="h-7 w-7" /> },
    { id: 'pix', label: 'Pix', icon: <PixSymbol className="h-7 w-7" />, active: true },
    { id: 'payments', label: 'Pagamentos', icon: <Barcode className="h-7 w-7" /> },
    { id: 'cards', label: 'Cartões', icon: <CreditCard className="h-7 w-7" /> },
    { id: 'loans', label: 'Empréstimos', icon: <CircleDollarSign className="h-7 w-7" /> },
    { id: 'open-finance', label: 'Open Finance', icon: <PieChart className="h-7 w-7" /> },
    { id: 'schedule', label: 'Agendamentos', icon: <CalendarDays className="h-7 w-7" /> },
    { id: 'personalize', label: 'Personalizar', icon: <SlidersHorizontal className="h-7 w-7" />, highlight: true },
  ]

  const handleFavorite = (item: Favorite) => {
    if (item.active) {
      onOpenPix()
      return
    }
    notify(item.label)
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background pb-24 animate-fade-in">
      {/* Cabeçalho vermelho */}
      <header className="relative bg-brand-gradient text-primary-foreground">
        <div className="flex items-center justify-between px-6 pt-4">
          <span className="w-10" aria-hidden />
          <h1 className="text-xl font-bold tracking-tight">RealPayz</h1>
          <button
            type="button"
            onClick={() => notify('Notificações')}
            aria-label="Notificações"
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-background/10"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-primary" />
          </button>
        </div>

        <div className="flex items-center justify-between px-6 pt-6">
          <p className="text-xl font-medium">Olá, {name}</p>
          <button
            type="button"
            onClick={onLogout}
            className="text-base font-semibold underline underline-offset-4 decoration-2"
          >
            Sair
          </button>
        </div>

        <div className="flex items-end justify-between px-6 pt-6">
          <div className="flex flex-col gap-1">
            <span className="text-base text-primary-foreground/85">Saldo</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold tabular-nums tracking-tight">
                {showBalance ? formatBRL(balance) : 'R$ ••••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowBalance((v) => !v)}
                aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-background/10"
              >
                {showBalance ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
              </button>
            </div>
            <span className="text-sm text-primary-foreground/75">
              {showBalance ? `≈ ${formatMZN(convertToMZN(balance))}` : '≈ •••• MZN'}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenStatement}
            className="text-base font-semibold underline underline-offset-4 decoration-2"
          >
            Ver extrato
          </button>
        </div>

        <div className="px-6 pt-6">
          <button
            type="button"
            onClick={() => notify('Assistente virtual')}
            className="flex h-14 w-full items-center gap-3 rounded-full bg-primary-deep/60 px-3 text-left transition-colors hover:bg-primary-deep/80"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold text-primary">
              RP
            </span>
            <span className="flex-1 truncate text-base">Buscar serviço ou falar com o assistente</span>
            <Search className="mr-1 h-5 w-5" />
          </button>
        </div>

        {/* Onda de transição */}
        <div className="relative mt-4 h-14 overflow-hidden">
          <svg
            viewBox="0 0 400 56"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-0 h-full w-full"
            aria-hidden
          >
            <path d="M0 30 C 80 60, 160 0, 240 28 S 360 60, 400 22 L400 56 L0 56 Z" fill="var(--background)" opacity="0.45" />
            <path d="M0 40 C 100 10, 200 62, 300 30 S 380 20, 400 32 L400 56 L0 56 Z" fill="var(--background)" />
          </svg>
        </div>
      </header>

      <main className="flex flex-col gap-8 px-6 pt-4">
        {/* Favoritos */}
        <section className="flex flex-col gap-5">
          <h2 className="text-2xl font-semibold">Favoritos</h2>
          <div className="grid grid-cols-4 gap-x-3 gap-y-6">
            {favorites.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleFavorite(item)}
                className="group flex flex-col items-center gap-2"
              >
                <span
                  className={cn(
                    'flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-card shadow-[0_4px_14px_rgba(0,0,0,0.08)] ring-1 ring-border/60 transition-all duration-200 group-active:scale-95',
                    item.highlight ? 'text-chart-3' : 'text-primary',
                    !item.active && !item.highlight && 'group-hover:ring-primary/30',
                  )}
                >
                  {item.icon}
                </span>
                <span
                  className={cn(
                    'text-center text-xs font-semibold leading-tight',
                    item.highlight ? 'text-chart-3' : 'text-foreground/80',
                  )}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Card promocional */}
        <button
          type="button"
          onClick={() => notify('Atualização de dados')}
          className="flex items-center gap-4 overflow-hidden rounded-2xl bg-card text-left shadow-[0_6px_20px_rgba(0,0,0,0.08)] ring-1 ring-border/60 transition-transform active:scale-[0.99]"
        >
          <Image
            src="/images/promo-update.png"
            alt=""
            width={104}
            height={152}
            className="h-38 w-26 shrink-0 object-cover"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-1 py-4">
            <span className="text-base font-semibold">Novidades por aí?</span>
            <span className="text-pretty text-sm text-muted-foreground">Atualize seus dados no app.</span>
          </span>
          <ChevronRight className="mr-4 h-6 w-6 shrink-0 text-primary" />
        </button>

        {/* Benefícios e parcerias — slide horizontal */}
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">Benefícios e parcerias</h2>
          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {BENEFITS.map((benefit) => (
              <article
                key={benefit.id}
                className="flex w-[80%] shrink-0 snap-start flex-col justify-between gap-6 rounded-2xl bg-brand-gradient p-5 text-primary-foreground shadow-lg shadow-primary/20"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/15">
                  {benefit.icon}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold">{benefit.title}</h3>
                  <p className="text-pretty text-sm leading-relaxed text-primary-foreground/85">{benefit.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Navegação inferior */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-card/95 backdrop-blur"
      >
        <div className="grid grid-cols-4 px-2 pb-3 pt-2">
          <button type="button" className="flex flex-col items-center gap-1" aria-current="page">
            <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-lg shadow-primary/30">
              <Home className="h-6 w-6" />
            </span>
            <span className="text-xs font-semibold">Início</span>
          </button>
          {[
            { id: 'shop', label: 'Shop', icon: <ShoppingBag className="h-6 w-6" /> },
            { id: 'profile', label: 'Perfil', icon: <User className="h-6 w-6" /> },
            { id: 'services', label: 'Serviços', icon: <LayoutGrid className="h-6 w-6" /> },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => notify(item.label)}
              className="flex flex-col items-center gap-1 text-primary"
            >
              <span className="flex h-7 items-center">{item.icon}</span>
              <span className="text-xs font-semibold text-foreground/80">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <InactiveToast message={message} />
    </div>
  )
}
