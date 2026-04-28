import Link from 'next/link'
import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { getArchivedQuestions, getUserAnsweredQuestionIds, ArchivedQuestionsFilter } from '@/lib/questions'
import { getUserBookmarkSet } from '@/lib/bookmarks'
import BookmarkButton from '@/components/BookmarkButton'

export const metadata: Metadata = {
  title: 'Arquivo de Perguntas — Knowala',
  description: 'Explore todas as perguntas do dia já publicadas no Knowala e participe das discussões.',
}

interface Props {
  searchParams: Promise<{ pagina?: string; filtro?: string }>
}

function formatDate(date: Date | null): string {
  if (!date) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'long',
    year: '2-digit',
  }).format(date)
}

const FILTERS: { value: ArchivedQuestionsFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'respondidas', label: 'Respondidas' },
  { value: 'nao-respondidas', label: 'Não respondidas' },
]

export default async function ArquivoPage({ searchParams }: Props) {
  const { pagina, filtro } = await searchParams
  const page = Math.max(1, parseInt(pagina || '1'))
  const filter: ArchivedQuestionsFilter =
    filtro === 'respondidas' || filtro === 'nao-respondidas' ? filtro : 'todas'

  const session = await auth()
  const userId = session?.user?.id
  const isAuthenticated = !!userId

  const answeredIds = userId ? await getUserAnsweredQuestionIds(userId) : undefined

  const [{ questions, total, totalPages }, bookmarkSet] = await Promise.all([
    getArchivedQuestions(page, 20, filter, answeredIds),
    userId ? getUserBookmarkSet(userId) : Promise.resolve(null),
  ])

  function filterHref(f: ArchivedQuestionsFilter) {
    return f === 'todas' ? '/arquivo' : `/arquivo?filtro=${f}`
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Arquivo de Perguntas</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {total} {total === 1 ? 'pergunta publicada' : 'perguntas publicadas'}
        </p>
      </div>

      {isAuthenticated && (
        <div className="flex items-center gap-2 mb-4">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={filterHref(f.value)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filter === f.value
                  ? 'border-[var(--text-secondary)] bg-[var(--bg-card)] text-[var(--text-primary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-[var(--text-secondary)]">Nenhuma pergunta encontrada.</p>
          <Link href="/arquivo" className="mt-4 inline-block text-sm text-[#818CF8] hover:underline">
            Ver todas as perguntas
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => {
            const answered = answeredIds?.has(q.id) ?? false
            return (
              <div
                key={q.id}
                className="flex items-start gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--text-secondary)] transition-colors group"
              >
                <Link
                  href={`/pergunta/${q.slug}`}
                  className="flex-1 min-w-0"
                >
                  <p className="text-[var(--text-primary)] font-medium group-hover:text-white transition-colors leading-snug mb-2">
                    {q.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                    {q.publishedAt && (
                      <span className="capitalize">{formatDate(q.publishedAt)}</span>
                    )}
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      {q._count.answers} {q._count.answers === 1 ? 'resposta' : 'respostas'}
                    </span>
                    {isAuthenticated && answered && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-500">Respondida</span>
                      </>
                    )}
                  </div>
                </Link>
                <BookmarkButton
                  targetType="QUESTION"
                  targetId={q.id}
                  initialIsBookmarked={bookmarkSet?.questionIds.has(q.id) ?? false}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/arquivo?${filter !== 'todas' ? `filtro=${filter}&` : ''}pagina=${page - 1}`}
              className="px-4 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border)] rounded text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors"
            >
              ← Anterior
            </Link>
          )}

          <span className="text-sm text-[var(--text-secondary)] px-2">
            Página {page} de {totalPages}
          </span>

          {page < totalPages && (
            <Link
              href={`/arquivo?${filter !== 'todas' ? `filtro=${filter}&` : ''}pagina=${page + 1}`}
              className="px-4 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border)] rounded text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors"
            >
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
