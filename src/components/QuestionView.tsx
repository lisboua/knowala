import Link from 'next/link'
import { QuestionWithAnswers } from '@/types'
import QuestionCard from '@/components/QuestionCard'
import Answer from '@/components/Answer'
import AnswerForm from '@/components/AnswerForm'
import { AdjacentQuestion } from '@/lib/questions'

interface QuestionViewProps {
  question: QuestionWithAnswers
  currentUserId?: string
  isAuthenticated: boolean
  isHome?: boolean
  limitAnswers?: number
  isQuestionBookmarked?: boolean
  bookmarkedAnswerIds?: string[]
  bookmarkedCommentIds?: string[]
  prevQuestion?: AdjacentQuestion
  nextQuestion?: AdjacentQuestion
}

export default function QuestionView({ question, currentUserId, isAuthenticated, isHome = false, limitAnswers, isQuestionBookmarked = false, bookmarkedAnswerIds = [], bookmarkedCommentIds = [], prevQuestion, nextQuestion }: QuestionViewProps) {
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
          isHome={isHome}
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

      {!isHome && (prevQuestion || nextQuestion) && (
        <div className="flex items-start justify-between gap-4 mt-6 pb-8 border-t border-[var(--border)] pt-4">
          <div className="flex-1 min-w-0">
            {prevQuestion && (
              <Link
                href={`/pergunta/${prevQuestion.slug}`}
                className="group flex flex-col gap-0.5"
              >
                <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">← Pergunta anterior</span>
                <span className="text-sm text-[var(--text-primary)] line-clamp-2 group-hover:text-[#818CF8] transition-colors">{prevQuestion.content}</span>
              </Link>
            )}
          </div>
          <div className="flex-1 min-w-0 text-right">
            {nextQuestion && (
              <Link
                href={`/pergunta/${nextQuestion.slug}`}
                className="group flex flex-col gap-0.5 items-end"
              >
                <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Próxima pergunta →</span>
                <span className="text-sm text-[var(--text-primary)] line-clamp-2 group-hover:text-[#818CF8] transition-colors">{nextQuestion.content}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
