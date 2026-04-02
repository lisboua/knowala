'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'

interface Suggestion {
  id: string
  content: string
  postedByAdmin: boolean
  deletedByMod: boolean
  createdAt: string
  user: { name: string; username: string }
  _count: { votes: number }
  votes: { value: number }[]
}

export default function AdminSuggestoesPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/suggestions')
      const data = await res.json()
      if (data.success) {
        setSuggestions(data.data)
      }
    } catch {
      console.error('Failed to fetch suggestions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  async function togglePosted(id: string, currentValue: boolean) {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId: id, postedByAdmin: !currentValue }),
      })
      if (res.ok) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, postedByAdmin: !currentValue } : s))
        )
        setMessage(!currentValue ? 'Sugestão marcada como postada.' : 'Marcação removida.')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch {
      setMessage('Erro ao atualizar sugestão.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover esta sugestão?')) return
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: id, targetType: 'SUGGESTION' }),
      })
      if (res.ok) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, deletedByMod: true } : s))
        )
        setMessage('Sugestão removida.')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch {
      setMessage('Erro ao remover sugestão.')
    } finally {
      setActionLoading(null)
    }
  }

  function getScore(s: Suggestion) {
    const up = s.votes.filter((v) => v.value === 1).length
    const down = s.votes.filter((v) => v.value === -1).length
    return up - down
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-6">Sugestões de Perguntas</h1>

      {message && (
        <div className="mb-4 p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)]">
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-6 h-6 border-2 border-[#818CF8] border-t-transparent rounded-full" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 text-center">
          <p className="text-[var(--text-secondary)] text-sm">Nenhuma sugestão ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => {
            const score = getScore(s)
            return (
              <div
                key={s.id}
                className={`bg-[var(--bg-card)] border rounded-lg p-4 ${
                  s.deletedByMod ? 'border-red-500/30 opacity-60' : 'border-[var(--border)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Score */}
                  <div className="flex flex-col items-center min-w-[40px]">
                    <span className={`text-sm font-bold ${
                      score > 0 ? 'text-[#818CF8]' : score < 0 ? 'text-red-400' : 'text-[var(--text-secondary)]'
                    }`}>
                      {score > 0 ? `+${score}` : score}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">votos</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-[var(--text-secondary)]">
                        u/{s.user.username} · {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      {s.postedByAdmin && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">
                          ✓ Postada
                        </span>
                      )}
                      {s.deletedByMod && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">
                          Removida
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-primary)] mb-2">{s.content}</p>

                    {!s.deletedByMod && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={s.postedByAdmin ? 'secondary' : 'primary'}
                          onClick={() => togglePosted(s.id, s.postedByAdmin)}
                          loading={actionLoading === s.id}
                          disabled={!!actionLoading}
                        >
                          {s.postedByAdmin ? 'Desmarcar Postada' : 'Marcar como Postada'}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(s.id)}
                          loading={actionLoading === s.id}
                          disabled={!!actionLoading}
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
