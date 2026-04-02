'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

interface Question {
  id: string
  content: string
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
  publishedAt: string | null
  scheduledFor: string | null
  createdAt: string
  _count: { answers: number }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'text-[var(--text-secondary)]' },
  SCHEDULED: { label: 'Agendada', color: 'text-blue-400' },
  PUBLISHED: { label: 'Publicada', color: 'text-green-400' },
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [content, setContent] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED' | 'PUBLISHED'>('DRAFT')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/questions')
      const data = await res.json()
      if (data.success) {
        setQuestions(data.data.questions)
      }
    } catch {
      console.error('Failed to fetch questions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const body: Record<string, unknown> = { content, status }
      if (status === 'SCHEDULED' && scheduledFor) {
        body.scheduledFor = new Date(scheduledFor).toISOString()
      }

      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar pergunta.')
      } else {
        setSuccess('Pergunta criada com sucesso!')
        setContent('')
        setScheduledFor('')
        setStatus('DRAFT')
        setShowCreateModal(false)
        fetchQuestions()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      setError('Erro ao criar pergunta.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePublish(id: string) {
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'PUBLISHED' }),
      })

      if (res.ok) {
        setSuccess('Pergunta publicada!')
        fetchQuestions()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      setError('Erro ao publicar pergunta.')
    }
  }

  function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Perguntas</h1>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          + Nova Pergunta
        </Button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-6 h-6 border-2 border-[#818CF8] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
          {questions.length === 0 ? (
            <p className="text-center text-[var(--text-secondary)] py-8 text-sm">Nenhuma pergunta criada ainda.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {questions.map((q) => {
                const statusInfo = STATUS_LABELS[q.status]
                return (
                  <div key={q.id} className="p-4 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] mb-1 line-clamp-2">{q.content}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                          <span className={`font-medium ${statusInfo.color}`}>
                            ● {statusInfo.label}
                          </span>
                          {q.publishedAt && (
                            <span>Publicada: {formatDateTime(q.publishedAt)}</span>
                          )}
                          {q.scheduledFor && q.status === 'SCHEDULED' && (
                            <span>Agendada: {formatDateTime(q.scheduledFor)}</span>
                          )}
                          <span>{q._count.answers} respostas</span>
                          <span>Criada: {formatDateTime(q.createdAt)}</span>
                        </div>
                      </div>
                      {q.status !== 'PUBLISHED' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handlePublish(q.id)}
                          className="flex-shrink-0"
                        >
                          Publicar
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nova Pergunta"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Textarea
            label="Conteúdo da Pergunta"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Qual é a sua pergunta do dia?"
            rows={4}
            required
          />

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#818CF8]"
            >
              <option value="DRAFT">Rascunho</option>
              <option value="SCHEDULED">Agendar</option>
              <option value="PUBLISHED">Publicar Agora</option>
            </select>
          </div>

          {status === 'SCHEDULED' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Data e Hora de Publicação
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#818CF8]"
                required
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">Horário de Brasília (UTC-3)</p>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Criar Pergunta
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
