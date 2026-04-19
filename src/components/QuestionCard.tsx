import Link from 'next/link'
import BookmarkButton from '@/components/BookmarkButton'
import { QuestionWithAnswers } from '@/types'

interface QuestionCardProps {
  question: QuestionWithAnswers
  isHome?: boolean
  isBookmarked?: boolean
  isAuthenticated?: boolean
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

export default function QuestionCard({ question, isHome = false, isBookmarked = false, isAuthenticated = false }: QuestionCardProps) {
  const publishedDate = question.publishedAt ? formatDate(new Date(question.publishedAt)) : null
  const answersCount = question.answers.length
  const permalink = question.slug ? `/pergunta/${question.slug}` : null

  return (
    <div className="card-shadow bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-bold text-[#818CF8] uppercase tracking-[0.12em] bg-[#818CF8]/10 px-2.5 py-1 rounded-full">
          Pergunta do Dia
        </span>
        {publishedDate && (
          <span className="text-xs text-[var(--text-secondary)] capitalize">{publishedDate}</span>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight mb-5 tracking-tight">
        {question.content}
      </h1>

      <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {answersCount} {answersCount === 1 ? 'resposta' : 'respostas'}
        </span>

        {isHome && permalink && (
          <Link
            href={permalink}
            className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            link permanente
          </Link>
        )}

        <div className="ml-auto">
          <BookmarkButton
            targetType="QUESTION"
            targetId={question.id}
            initialIsBookmarked={isBookmarked}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    </div>
  )
}
