'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import SuggestionCard from '@/components/SuggestionCard'
import Link from 'next/link'

interface Suggestion {
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
}

function SuggestoesContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState(searchParams.get('sort') || 'votes')
  const [page, setPage] = useState(parseInt(searchParams.get('pagina') || '1'))
  const [totalPages, setTotalPages] = useState(1)

  // New suggestion form
  const [showForm, setShowForm] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/suggestions?sort=${sort}&page=${page}`)
      const data = await res.json()
      if (data.success) {
        setSuggestions(data.data.suggestions)
        setTotalPages(data.data.totalPages)
      }
    } catch {
      console.error('Failed to fetch suggestions')
    } finally {
      setLoading(false)
    }
  }, [sort, page])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  function handleSortChange(newSort: string) {
    setSort(newSort)
    setPage(1)
    router.push(`/sugestoes?sort=${newSort}`, { scroll: false })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newContent.trim().length < 10) {
      setFormError('A sugestão deve ter pelo menos 10 caracteres.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent.trim() }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuggestions((prev) => [data.data, ...prev])
        setNewContent('')
        setShowForm(false)
      } else {
        setFormError(data.error || 'Erro ao enviar sugestão.')
      }
    } catch {
      setFormError('Erro ao enviar sugestão.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleDelete(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id))
  }

  const isAuthenticated = status === 'authenticated'

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Title + CTA */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Sugestões de Perguntas</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Sugira perguntas que você gostaria de ver no Knowala. Vote nas melhores!
            </p>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="shrink-0 text-sm bg-[#818CF8] hover:bg-[#6366F1] text-white px-4 py-2 rounded font-semibold transition-colors"
            >
              {showForm ? 'Cancelar' : '+ Sugerir'}
            </button>
          ) : (
            <Link
              href="/login"
              className="shrink-0 text-sm bg-[#818CF8] hover:bg-[#6366F1] text-white px-4 py-2 rounded font-semibold transition-colors"
            >
              Entrar para Sugerir
            </Link>
          )}
        </div>

        {/* New suggestion form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Qual pergunta você gostaria de ver?"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded p-3 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-[#818CF8] placeholder-[var(--text-secondary)]"
              rows={3}
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[var(--text-secondary)]">{newContent.length}/500</span>
              <button
                type="submit"
                disabled={submitting || newContent.trim().length < 10}
                className="text-sm bg-[#818CF8] hover:bg-[#6366F1] text-white px-4 py-1.5 rounded font-semibold disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Enviando...' : 'Enviar Sugestão'}
              </button>
            </div>
            {formError && (
              <p className="text-xs text-red-400 mt-2">{formError}</p>
            )}
          </form>
        )}

        {/* Sort tabs */}
        <div className="flex gap-1 mb-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-1 w-fit">
          <button
            onClick={() => handleSortChange('votes')}
            className={`px-4 py-1.5 text-sm rounded font-medium transition-colors ${
              sort === 'votes' ? 'bg-[#818CF8] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Mais Votadas
          </button>
          <button
            onClick={() => handleSortChange('recent')}
            className={`px-4 py-1.5 text-sm rounded font-medium transition-colors ${
              sort === 'recent' ? 'bg-[#818CF8] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Mais Recentes
          </button>
        </div>

        {/* Suggestions list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-6 h-6 border-2 border-[#818CF8] border-t-transparent rounded-full" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 text-center">
            <p className="text-[var(--text-secondary)] text-sm">
              Nenhuma sugestão ainda. Seja o primeiro a sugerir uma pergunta!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                id={suggestion.id}
                content={suggestion.content}
                postedByAdmin={suggestion.postedByAdmin}
                createdAt={suggestion.createdAt}
                user={suggestion.user}
                upvotes={suggestion.upvotes}
                downvotes={suggestion.downvotes}
                score={suggestion.score}
                userVote={suggestion.userVote}
                isAuthenticated={isAuthenticated}
                isOwner={session?.user?.id === suggestion.user.id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {page > 1 && (
              <button
                onClick={() => setPage(page - 1)}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 border border-[var(--border)] rounded transition-colors"
              >
                ← Anterior
              </button>
            )}
            <span className="text-sm text-[var(--text-secondary)] px-3 py-1.5">
              Página {page} de {totalPages}
            </span>
            {page < totalPages && (
              <button
                onClick={() => setPage(page + 1)}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 border border-[var(--border)] rounded transition-colors"
              >
                Próxima →
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default function SuggestoesPage() {
  return (
    <Suspense>
      <SuggestoesContent />
    </Suspense>
  )
}
