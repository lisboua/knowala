import Link from 'next/link'
import { Metadata } from 'next'
import { db } from '@/lib/db'

type SearchResult = {
  id: string
  content: string
  slug: string | null
  publishedAt: Date | null
  answerCount: bigint
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" — Busca no Knowala` : 'Busca — Knowala',
  }
}

function formatDate(date: Date | null): string {
  if (!date) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default async function BuscaPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  let results: SearchResult[] = []

  if (query.length >= 2) {
    results = await db.$queryRaw<SearchResult[]>`
      SELECT
        q.id,
        q.content,
        q.slug,
        q."publishedAt",
        COUNT(a.id) AS "answerCount"
      FROM "Question" q
      LEFT JOIN "Answer" a ON a."questionId" = q.id
      WHERE q.status = 'PUBLISHED'
        AND to_tsvector('simple', q.content) @@ plainto_tsquery('simple', ${query})
      GROUP BY q.id
      ORDER BY ts_rank(to_tsvector('simple', q.content), plainto_tsquery('simple', ${query})) DESC
      LIMIT 50
    `
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          {query ? `Resultados para "${query}"` : 'Busca'}
        </h1>
        {query.length >= 2 && (
          <p className="text-sm text-[var(--text-secondary)]">
            {results.length} {results.length === 1 ? 'pergunta encontrada' : 'perguntas encontradas'}
          </p>
        )}
      </div>

      {query.length < 2 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-[var(--text-secondary)]">Digite ao menos 2 caracteres para buscar.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-[var(--text-secondary)] mb-4">Nenhuma pergunta encontrada para "{query}".</p>
          <Link href="/arquivo" className="text-sm text-[#818CF8] hover:underline">
            Ver todas as perguntas →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((q) => (
            <Link
              key={q.id}
              href={`/pergunta/${q.slug}`}
              className="block bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--text-secondary)] transition-colors group"
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
                  {Number(q.answerCount)} {Number(q.answerCount) === 1 ? 'resposta' : 'respostas'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
