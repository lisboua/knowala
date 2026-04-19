import Link from 'next/link'
import { QuestionWithAnswers } from '@/types'
import QuestionCard from '@/components/QuestionCard'
import Answer from '@/components/Answer'
import AnswerForm from '@/components/AnswerForm'

interface QuestionViewProps {
  question: QuestionWithAnswers
  currentUserId?: string
  isAuthenticated: boolean
  isHome?: boolean
  limitAnswers?: number
  isQuestionBookmarked?: boolean
  bookmarkedAnswerIds?: string[]
  bookmarkedCommentIds?: string[]
}

export default function QuestionView({ question, currentUserId, isAuthenticated, isHome = false, limitAnswers, isQuestionBookmarked = false, bookmarkedAnswerIds = [], bookmarkedCommentIds = [] }: QuestionViewProps) {
  const hasAlreadyAnswered = question.answers.some((a) => a.userId === currentUserId)
  const displayedAnswers = limitAnswers ? question.answers.slice(0, limitAnswers) : question.answers
  const hasMore = limitAnswers != null && question.answers.length > limitAnswers

  return (
    <div className="max-w-2xl mx-auto">
      <QuestionCard question={question} isHome={isHome} isBookmarked={isQuestionBookmarked} isAuthenticated={isAuthenticated} />

      <div id="responder">
        <AnswerForm
          questionId={question.id}
          isAuthenticated={isAuthenticated}
          hasAlreadyAnswered={hasAlreadyAnswered}
        />
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {question.answers.length}{' '}
            {question.answers.length === 1 ? 'Resposta' : 'Respostas'}
          </h2>
          <span className="text-xs text-[var(--text-secondary)]">Ordenado por: relevância</span>
        </div>

        {question.answers.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 text-center">
            <p className="text-[var(--text-secondary)]">Seja o primeiro a responder!</p>
          </div>
        ) : (
          <div>
            {displayedAnswers.map((answer) => (
              <Answer
                key={answer.id}
                answer={answer}
                currentUserId={currentUserId}
                isAuthenticated={isAuthenticated}
                isBookmarked={bookmarkedAnswerIds.includes(answer.id)}
                bookmarkedCommentIds={bookmarkedCommentIds}
              />
            ))}
            {hasMore && question.slug && (
              <div className="pt-2 pb-4">
                <Link
                  href={`/pergunta/${question.slug}`}
                  className="text-sm text-[#818CF8] hover:underline"
                >
                  Ver todas as {question.answers.length} respostas →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
