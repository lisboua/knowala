'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import BookmarkButton from '@/components/BookmarkButton'

type Tab = 'QUESTION' | 'ANSWER' | 'COMMENT'

interface BookmarkQuestion {
  id: string
  question: {
    id: string
    content: string
    slug: string | null
    publishedAt: string | null
    _count: { answers: number }
  }
}

interface BookmarkAnswer {
  id: string
  answer: {
    id: string
    content: string
    createdAt: string
    user: { name: string; username: string }
    question: { id: string; content: string; slug: string | null }
  }
}

interface BookmarkComment {
  id: string
  comment: {
    id: string
    content: string
    createdAt: string
    user: { name: string; username: string }
    answer: {
      id: string
      question: { id: string; content: string; slug: string | null }
    }
  }
}

type BookmarkItem = BookmarkQuestion | BookmarkAnswer | BookmarkComment

const TABS: { key: Tab; label: string }[] = [
  { key: 'QUESTION', label: 'Perguntas' },
  { key: 'ANSWER', label: 'Respostas' },
  { key: 'COMMENT', label: 'Comentários' },
]

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function truncate(text: string, maxLength = 200): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export default function GuardadosClient() {
  const [activeTab, setActiveTab] = useState<Tab>('QUESTION')
  const [items, setItems] = useState<BookmarkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchItems = useCallback(async (tab: Tab, pageNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookmarks?tipo=${tab}&pagina=${pageNum}`)
      const data = await res.json()
setItems(data.data ?? [])
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems(activeTab, page)
  }, [activeTab, page, fetchItems])

  function handleTabChange(tab: Tab) {
    setItems([])
    setLoading(true)
    setActiveTab(tab)
    setPage(1)
  }

  function handleRemove(id: string) {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-[#818CF8] text-[#818CF8]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-[var(--text-secondary)]">
            Nenhum{activeTab === 'QUESTION' ? 'a pergunta guardada' : activeTab === 'ANSWER' ? 'a resposta guardada' : ' comentário guardado'} ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'QUESTION' && (items as BookmarkQuestion[]).map(item => (
            <div key={item.id} className="flex items-start gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
              <Link href={item.question.slug ? `/pergunta/${item.question.slug}` : '#'} className="flex-1 min-w-0 group">
                <p className="text-[var(--text-primary)] font-medium leading-snug group-hover:text-[#818CF8] transition-colors mb-1.5">
                  {item.question.content}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  {item.question.publishedAt && <span className="capitalize">{formatDate(item.question.publishedAt)}</span>}
                  <span>·</span>
                  <span>{item.question._count.answers} {item.question._count.answers === 1 ? 'resposta' : 'respostas'}</span>
                </div>
              </Link>
              <BookmarkButton
                targetType="QUESTION"
                targetId={item.question.id}
                initialIsBookmarked
                isAuthenticated
                onRemove={() => handleRemove(item.id)}
              />
            </div>
          ))}

          {activeTab === 'ANSWER' && (items as BookmarkAnswer[]).filter(item => !!item.answer?.question).map(item => (
            <div key={item.id} className="flex items-start gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
              <div className="flex-1 min-w-0">
                <Link
                  href={item.answer.question.slug ? `/pergunta/${item.answer.question.slug}` : '#'}
                  className="text-xs text-[#818CF8] hover:underline block mb-1.5 truncate"
                >
                  {item.answer.question.content}
                </Link>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-1.5 whitespace-pre-wrap break-words">
                  {truncate(item.answer.content)}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  u/{item.answer.user.username} · {formatDate(item.answer.createdAt)}
                </p>
              </div>
              <BookmarkButton
                targetType="ANSWER"
                targetId={item.answer.id}
                initialIsBookmarked
                isAuthenticated
                onRemove={() => handleRemove(item.id)}
              />
            </div>
          ))}

          {activeTab === 'COMMENT' && (items as BookmarkComment[]).filter(item => !!item.comment?.answer?.question).map(item => (
            <div key={item.id} className="flex items-start gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
              <div className="flex-1 min-w-0">
                <Link
                  href={item.comment.answer.question.slug ? `/pergunta/${item.comment.answer.question.slug}` : '#'}
                  className="text-xs text-[#818CF8] hover:underline block mb-1.5 truncate"
                >
                  {item.comment.answer.question.content}
                </Link>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-1.5 whitespace-pre-wrap break-words">
                  {truncate(item.comment.content)}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  u/{item.comment.user.username} · {formatDate(item.comment.createdAt)}
                </p>
              </div>
              <BookmarkButton
                targetType="COMMENT"
                targetId={item.comment.id}
                initialIsBookmarked
                isAuthenticated
                onRemove={() => handleRemove(item.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <button
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border)] rounded text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors"
            >
              ← Anterior
            </button>
          )}
          <span className="text-sm text-[var(--text-secondary)] px-2">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border)] rounded text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors"
            >
              Próxima →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
