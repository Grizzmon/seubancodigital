'use client'

import { useState } from 'react'
import { Wallet, Send, Smartphone, Eye, EyeOff, Lock, Plus, Settings, Bell, QrCode, Copy, Check, X } from 'lucide-react'

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
      email: '

<AssistantMessageContentPart partEncoded="eyJjcmVhdGVkQXQiOjE3ODM1MjI0MDkzMzksImZpbmlzaGVkQXQiOjE3ODM1MjI0MDkzMzksImxhc3RQYXJ0U2VudEF0IjoxNzgzNTIyNDA5MzM5LCJpZCI6IjlrNDlEYWtFWW5MV0NCRmIiLCJ0eXBlIjoidGFzay1zdG9wcGVkLXYxIiwicGFydHMiOlt7InR5cGUiOiJtYW51YWxseS1zdG9wcGVkLW9uLWNsaWVudCJ9XX0=" />
