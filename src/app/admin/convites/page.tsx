'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface InviteCode {
  id: string
  code: string
  createdBy: { username: string; name: string }
  usedBy: { username: string; name: string } | null
  usedAt: string | null
  createdAt: string
}

interface WaitlistEntry {
  id: string
  email: string
  createdAt: string
}

interface UserInviteStat {
  id: string
  username: string
  name: string
  invitesRemaining: number
  _count: { inviteCodesCreated: number }
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<InviteCode[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [userStats, setUserStats] = useState<UserInviteStat[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [givingInvites, setGivingInvites] = useState(false)

  // Generate form
  const [genQuantity, setGenQuantity] = useState('5')

  // Give invites form
  const [giveEmail, setGiveEmail] = useState('')
  const [giveQuantity, setGiveQuantity] = useState('5')
  const [giveMessage, setGiveMessage] = useState('')

  const [copied, setCopied] = useState<string | null>(null)
  const [tab, setTab] = useState<'invites' | 'waitlist' | 'users'>('invites')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/invites')
      const data = await res.json()
      if (data.success) {
        setInvites(data.invites)
        setWaitlist(data.waitlist)
        setUserStats(data.userInviteStats)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function generateCodes() {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: parseInt(genQuantity) || 5 }),
      })
      await res.json()
      await fetchData()
    } catch {
      // silently fail
    } finally {
      setGenerating(false)
    }
  }

  async function giveInvitesToUser() {
    if (!giveEmail.trim()) return
    setGivingInvites(true)
    setGiveMessage('')
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: parseInt(giveQuantity) || 5, assignToEmail: giveEmail.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setGiveMessage(data.message)
        setGiveEmail('')
        await fetchData()
      } else {
        setGiveMessage(data.error || 'Erro.')
      }
    } catch {
      setGiveMessage('Erro de conexão.')
    } finally {
      setGivingInvites(false)
    }
  }

  function copyCode(code: string) {
    const url = `${window.location.origin}/register?invite=${code}`
    navigator.clipboard.writeText(url)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-[#818CF8] border-t-transparent rounded-full" />
      </div>
    )
  }

  const unusedInvites = invites.filter((i) => !i.usedBy)
  const usedInvites = invites.filter((i) => i.usedBy)

  return (
    <div>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-6">Gerenciar Convites</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-2xl font-bold text-[#818CF8]">{unusedInvites.length}</p>
          <p className="text-xs text-[var(--text-secondary)]">Códigos disponíveis</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">{usedInvites.length}</p>
          <p className="text-xs text-[var(--text-secondary)]">Códigos usados</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{invites.length}</p>
          <p className="text-xs text-[var(--text-secondary)]">Total de códigos</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-2xl font-bold text-yellow-400">{waitlist.length}</p>
          <p className="text-xs text-[var(--text-secondary)]">Lista de espera</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Generate codes */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Gerar códigos de convite</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-3">Cria códigos que você pode enviar diretamente para as pessoas do beta.</p>
          <div className="flex gap-2">
            <Input
              type="number"
              value={genQuantity}
              onChange={(e) => setGenQuantity(e.target.value)}
              placeholder="Quantidade"
              min={1}
              max={50}
            />
            <Button onClick={generateCodes} loading={generating} className="shrink-0">
              Gerar
            </Button>
          </div>
        </div>

        {/* Give invites to user */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Dar convites a um usuário</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-3">Adiciona convites ao saldo de um usuário existente.</p>
          <div className="space-y-2">
            <Input
              type="email"
              value={giveEmail}
              onChange={(e) => setGiveEmail(e.target.value)}
              placeholder="E-mail do usuário"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                value={giveQuantity}
                onChange={(e) => setGiveQuantity(e.target.value)}
                placeholder="Qtd"
                min={1}
                max={50}
              />
              <Button onClick={giveInvitesToUser} loading={givingInvites} className="shrink-0">
                Dar convites
              </Button>
            </div>
            {giveMessage && (
              <p className="text-xs text-[#818CF8]">{giveMessage}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
        {(['invites', 'waitlist', 'users'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'text-[#818CF8] border-[#818CF8]'
                : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
            }`}
          >
            {t === 'invites' ? `Códigos (${invites.length})` : t === 'waitlist' ? `Lista de Espera (${waitlist.length})` : `Usuários (${userStats.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'invites' && (
        <div className="space-y-2">
          {invites.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] py-8 text-center">Nenhum código gerado ainda.</p>
          ) : (
            invites.map((invite) => (
              <div
                key={invite.id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-[#818CF8] font-mono">{invite.code}</code>
                    {invite.usedBy ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">usado</span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">disponível</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Por @{invite.createdBy.username}
                    {invite.usedBy && <> → @{invite.usedBy.username}</>}
                    {' · '}{new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {!invite.usedBy && (
                  <button
                    onClick={() => copyCode(invite.code)}
                    className="shrink-0 text-xs px-2 py-1 rounded border border-[var(--border)] hover:border-[#818CF8] text-[var(--text-secondary)] hover:text-[#818CF8] transition-colors"
                  >
                    {copied === invite.code ? '✓' : 'Copiar'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'waitlist' && (
        <div className="space-y-2">
          {waitlist.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] py-8 text-center">Ninguém na lista de espera.</p>
          ) : (
            waitlist.map((entry) => (
              <div
                key={entry.id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-[var(--text-primary)]">{entry.email}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-2">
          {userStats.map((user) => (
            <div
              key={user.id}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">@{user.username}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#818CF8] font-mono">{user.invitesRemaining} restantes</p>
                <p className="text-xs text-[var(--text-secondary)]">{user._count.inviteCodesCreated} gerados</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
