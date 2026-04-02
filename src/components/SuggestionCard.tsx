'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface SuggestionCardProps {
  id: string
  content: string
  postedByAdmin: boolean
  createdAt: string
  user: {
    id: string
    name: string
    username: string
    image: string | null
  }
  upvotes: number
  downvotes: number
  score: number
  userVote: number | null
  isAuthenticated: boolean
  isOwner: boolean
  onDelete?: (id: string) => void
  onEdit?: (id: string, content: string) => void
}

export default function SuggestionCard({
  id,
  content,
  postedByAdmin,
  createdAt,
  user,
  upvotes: initialUpvotes,
  downvotes: initialDownvotes,
  score: initialScore,
  userVote: initialUserVote,
  isAuthenticated,
  isOwner,
  onDelete,
  onEdit,
}: SuggestionCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [userVote, setUserVote] = useState<number | null>(initialUserVote)
  const [showMenu, setShowMenu] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportMessage, setReportMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [editLoading, setEditLoading] = useState(false)
  const [displayContent, setDisplayContent] = useState(content)

  const score = upvotes - downvotes

  async function handleVote(value: 1 | -1) {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const prevVote = userVote
    const prevUpvotes = upvotes
    const prevDownvotes = downvotes

    let newValue: 1 | -1 | 0 = value

    if (userVote === value) {
      newValue = 0
      setUserVote(null)
      if (value === 1) setUpvotes((u) => u - 1)
      else setDownvotes((d) => d - 1)
    } else {
      if (userVote === 1) setUpvotes((u) => u - 1)
      if (userVote === -1) setDownvotes((d) => d - 1)
      if (value === 1) setUpvotes((u) => u + 1)
      if (value === -1) setDownvotes((d) => d + 1)
      setUserVote(value)
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/suggestions/${id}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: newValue }),
        })

        if (!res.ok) {
          setUpvotes(prevUpvotes)
          setDownvotes(prevDownvotes)
          setUserVote(prevVote)
        } else {
          const data = await res.json()
          if (data.success) {
            setUpvotes(data.data.upvotes)
            setDownvotes(data.data.downvotes)
            setUserVote(data.data.userVote)
          }
        }
      } catch {
        setUpvotes(prevUpvotes)
        setDownvotes(prevDownvotes)
        setUserVote(prevVote)
      }
    })
  }

  async function handleReport() {
    if (reportReason.length < 10) return
    setReportLoading(true)
    try {
      const res = await fetch(`/api/suggestions/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      })
      const data = await res.json()
      if (res.ok) {
        setReportMessage('Denúncia enviada com sucesso.')
        setShowReport(false)
        setReportReason('')
      } else {
        setReportMessage(data.error || 'Erro ao enviar denúncia.')
      }
      setTimeout(() => setReportMessage(''), 3000)
    } catch {
      setReportMessage('Erro ao enviar denúncia.')
    } finally {
      setReportLoading(false)
    }
  }

  async function handleEdit() {
    if (editContent.trim().length < 10) return
    setEditLoading(true)
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      if (res.ok) {
        setDisplayContent(editContent.trim())
        setIsEditing(false)
      }
    } catch {
      // ignore
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir esta sugestão?')) return
    try {
      const res = await fetch(`/api/suggestions/${id}`, { method: 'DELETE' })
      if (res.ok && onDelete) {
        onDelete(id)
      }
    } catch {
      // ignore
    }
  }

  const formattedDate = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--border)] transition-colors">
      {reportMessage && (
        <div className="mb-3 p-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-xs text-[var(--text-primary)]">
          {reportMessage}
        </div>
      )}

      <div className="flex gap-3">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-1 min-w-[32px]">
          <button
            onClick={() => handleVote(1)}
            disabled={isPending || isOwner}
            aria-label="Upvote"
            className={`p-1 rounded transition-colors ${
              userVote === 1
                ? 'text-[#818CF8]'
                : 'text-[var(--text-secondary)] hover:text-[#818CF8]'
            } disabled:opacity-50`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 14h4v7a1 1 0 001 1h6a1 1 0 001-1v-7h4a1 1 0 00.77-1.64l-8-10a1 1 0 00-1.54 0l-8 10A1 1 0 004 14z" />
            </svg>
          </button>
          <span
            className={`text-xs font-bold ${
              score > 0 ? 'text-[#818CF8]' : score < 0 ? 'text-[#7193ff]' : 'text-[var(--text-secondary)]'
            }`}
          >
            {score}
          </span>
          <button
            onClick={() => handleVote(-1)}
            disabled={isPending || isOwner}
            aria-label="Downvote"
            className={`p-1 rounded transition-colors ${
              userVote === -1
                ? 'text-[#7193ff]'
                : 'text-[var(--text-secondary)] hover:text-[#7193ff]'
            } disabled:opacity-50`}
          >
            <svg className="w-5 h-5 rotate-180" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 14h4v7a1 1 0 001 1h6a1 1 0 001-1v-7h4a1 1 0 00.77-1.64l-8-10a1 1 0 00-1.54 0l-8 10A1 1 0 004 14z" />
            </svg>
          </button>
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#818CF8] flex items-center justify-center text-white text-[10px] font-bold">
                {user.name[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs text-[var(--text-secondary)]">
              u/{user.username} · {formattedDate}
            </span>
            {postedByAdmin && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">
                ✓ Postada
              </span>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mb-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded p-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-[#818CF8]"
                rows={3}
                maxLength={500}
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleEdit}
                  disabled={editLoading || editContent.trim().length < 10}
                  className="text-xs bg-[#818CF8] hover:bg-[#6366F1] text-white px-3 py-1 rounded disabled:opacity-50"
                >
                  {editLoading ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditContent(displayContent) }}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-primary)] mb-2 whitespace-pre-wrap">{displayContent}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 relative">
            {isOwner && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                >
                  Excluir
                </button>
              </>
            )}
            {isAuthenticated && !isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  •••
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute left-0 bottom-full mb-1 bg-[var(--bg-card)] border border-[var(--border)] rounded shadow-lg z-20 overflow-hidden">
                      <button
                        onClick={() => { setShowMenu(false); setShowReport(true) }}
                        className="px-3 py-2 text-xs text-red-400 hover:bg-[var(--bg-hover)] whitespace-nowrap"
                      >
                        Denunciar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Report form */}
          {showReport && (
            <div className="mt-3 p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded">
              <p className="text-xs text-[var(--text-secondary)] mb-2">Por que está denunciando?</p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded p-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-[#818CF8]"
                rows={2}
                placeholder="Explique o motivo (mín. 10 caracteres)..."
                maxLength={500}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleReport}
                  disabled={reportLoading || reportReason.length < 10}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                  {reportLoading ? 'Enviando...' : 'Enviar Denúncia'}
                </button>
                <button
                  onClick={() => { setShowReport(false); setReportReason('') }}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
