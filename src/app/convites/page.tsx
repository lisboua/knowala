'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Invite {
  id: string
  code: string
  used: boolean
  usedBy: { username: string; name: string; image: string | null } | null
  usedAt: string | null
  createdAt: string
}

export default function ConvitesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch('/api/invites')
      const data = await res.json()
      if (data.success) {
        setInvites(data.invites)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchInvites()
    }
  }, [status, router, fetchInvites])

  async function shareInviteLink(code: string) {
    const url = `${window.location.origin}/register?invite=${code}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Convite para o Knowala', url })
        return
      } catch {
        // usuário cancelou ou share falhou — fallback para clipboard
      }
    }
    navigator.clipboard.writeText(url)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-[#818CF8] border-t-transparent rounded-full" />
      </div>
    )
  }

  const availableInvites = invites.filter((i) => !i.used)
  const usedInvites = invites.filter((i) => i.used)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Meus Convites</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-6">
        Convide amigos para o Knowala! Cada pessoa que você convidar também receberá convites para expandir a comunidade.
      </p>

      {/* Stats */}
      {invites.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[#818CF8]">{availableInvites.length}</p>
            <p className="text-xs text-[var(--text-secondary)]">Disponíveis</p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{usedInvites.length}</p>
            <p className="text-xs text-[var(--text-secondary)]">Usados</p>
          </div>
        </div>
      )}

      {/* Available invites */}
      {availableInvites.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Convites disponíveis</h2>
          <div className="space-y-2">
            {availableInvites.map((invite) => (
              <div
                key={invite.id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <code className="text-sm text-[#818CF8] font-mono">{invite.code}</code>
                </div>
                <button
                  onClick={() => shareInviteLink(invite.code)}
                  className="shrink-0 text-sm px-3 py-1.5 rounded border border-[var(--border)] hover:border-[#818CF8] text-[var(--text-secondary)] hover:text-[#818CF8] transition-colors"
                >
                  {copied === invite.code ? '✓ Copiado!' : 'Compartilhar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used invites */}
      {usedInvites.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Amigos convidados</h2>
          <div className="space-y-2">
            {usedInvites.map((invite) => (
              <div
                key={invite.id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm shrink-0">
                  ✓
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {invite.usedBy?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    @{invite.usedBy?.username}
                    {invite.usedAt && <> · {new Date(invite.usedAt).toLocaleDateString('pt-BR')}</>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {invites.length === 0 && (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <p className="text-4xl mb-3">✉️</p>
          <p className="text-sm">Você ainda não tem convites disponíveis.</p>
          <p className="text-xs mt-1">Os convites são liberados aos poucos pela equipe do Knowala.</p>
        </div>
      )}
    </div>
  )
}
