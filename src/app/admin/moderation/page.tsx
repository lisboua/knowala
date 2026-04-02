'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'

interface Report {
  id: string
  reason: string
  status: string
  targetType: 'ANSWER' | 'COMMENT' | 'SUGGESTION'
  targetId: string
  createdAt: string
  user: { name: string; username: string }
  answer?: {
    id: string
    content: string
    deletedByMod: boolean
    user: { name: string; username: string }
  } | null
  comment?: {
    id: string
    content: string
    deletedByMod: boolean
    user: { name: string; username: string }
  } | null
  suggestion?: {
    id: string
    content: string
    deletedByMod: boolean
    user: { name: string; username: string }
  } | null
}

export default function AdminModerationPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'PENDING' | 'RESOLVED'>('PENDING')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?status=${tab}`)
      const data = await res.json()
      if (data.success) {
        setReports(data.data.reports)
      }
    } catch {
      console.error('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  async function handleAction(reportId: string, action: 'resolve' | 'resolve_and_delete') {
    setActionLoading(reportId)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage(action === 'resolve_and_delete' ? 'Conteúdo removido e denúncia resolvida.' : 'Denúncia resolvida.')
        fetchReports()
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(data.error || 'Erro ao processar denúncia.')
      }
    } catch {
      setMessage('Erro ao processar denúncia.')
    } finally {
      setActionLoading(null)
    }
  }

  const targetContent = (report: Report) => {
    if (report.targetType === 'ANSWER' && report.answer) {
      return { content: report.answer.content, deleted: report.answer.deletedByMod, author: report.answer.user }
    }
    if (report.targetType === 'COMMENT' && report.comment) {
      return { content: report.comment.content, deleted: report.comment.deletedByMod, author: report.comment.user }
    }
    if (report.targetType === 'SUGGESTION' && report.suggestion) {
      return { content: report.suggestion.content, deleted: report.suggestion.deletedByMod, author: report.suggestion.user }
    }
    return null
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-6">Moderação</h1>

      {message && (
        <div className="mb-4 p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)]">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('PENDING')}
          className={`px-4 py-1.5 text-sm rounded font-medium transition-colors ${
            tab === 'PENDING' ? 'bg-[#818CF8] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setTab('RESOLVED')}
          className={`px-4 py-1.5 text-sm rounded font-medium transition-colors ${
            tab === 'RESOLVED' ? 'bg-[#818CF8] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Resolvidas
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-6 h-6 border-2 border-[#818CF8] border-t-transparent rounded-full" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 text-center">
          <p className="text-[var(--text-secondary)] text-sm">
            {tab === 'PENDING' ? 'Nenhuma denúncia pendente. 🎉' : 'Nenhuma denúncia resolvida ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const target = targetContent(report)
            const isActioning = actionLoading === report.id

            return (
              <div
                key={report.id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Reported by */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        report.targetType === 'ANSWER'
                          ? 'bg-[#818CF8]/10 text-[#818CF8]'
                          : report.targetType === 'SUGGESTION'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {report.targetType === 'ANSWER' ? 'Resposta' : report.targetType === 'SUGGESTION' ? 'Sugestão' : 'Comentário'}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        Denunciado por u/{report.user.username} ·{' '}
                        {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {/* Reason */}
                    <div className="mb-3">
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Motivo da denúncia:</p>
                      <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] rounded p-2">{report.reason}</p>
                    </div>

                    {/* Target content */}
                    {target ? (
                      <div className={`rounded p-2 mb-3 ${target.deleted ? 'bg-red-500/5 border border-red-500/20' : 'bg-[var(--bg-primary)]'}`}>
                        <p className="text-xs text-[var(--text-secondary)] mb-1">
                          Conteúdo de u/{target.author.username}:
                          {target.deleted && <span className="ml-2 text-red-400">● Já removido</span>}
                        </p>
                        {target.deleted ? (
                          <p className="text-xs italic text-[var(--text-secondary)]">Este conteúdo já foi removido pela moderação.</p>
                        ) : (
                          <p className="text-sm text-[var(--text-primary)] line-clamp-4">{target.content}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)] mb-3">Conteúdo não encontrado.</p>
                    )}

                    {/* Actions */}
                    {tab === 'PENDING' && (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAction(report.id, 'resolve')}
                          loading={isActioning}
                          disabled={!!actionLoading}
                        >
                          Manter Conteúdo
                        </Button>
                        {target && !target.deleted && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleAction(report.id, 'resolve_and_delete')}
                            loading={isActioning}
                            disabled={!!actionLoading}
                          >
                            Remover Conteúdo
                          </Button>
                        )}
                        {target?.deleted && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAction(report.id, 'resolve')}
                            loading={isActioning}
                            disabled={!!actionLoading}
                          >
                            Marcar como Resolvida
                          </Button>
                        )}
                      </div>
                    )}

                    {tab === 'RESOLVED' && (
                      <span className="text-xs text-green-400 font-medium">● Resolvida</span>
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
