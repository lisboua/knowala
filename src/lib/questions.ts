import { db } from '@/lib/db'
import { QuestionWithAnswers } from '@/types'

const questionInclude = {
  answers: {
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true, ecoScore: true },
      },
      votes: true,
      comments: {
        where: { parentId: null },
        include: {
          user: { select: { id: true, name: true, username: true, image: true, ecoScore: true } },
          votes: true,
          replies: {
            include: {
              user: { select: { id: true, name: true, username: true, image: true, ecoScore: true } },
              votes: true,
              replies: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' as const },
      },
    },
  },
}

function sortAnswersByScore(question: QuestionWithAnswers): QuestionWithAnswers {
  question.answers.sort((a, b) => {
    const scoreA = a.votes.reduce((sum, v) => sum + v.value, 0)
    const scoreB = b.votes.reduce((sum, v) => sum + v.value, 0)
    return scoreB - scoreA
  })
  return question
}

export async function getCurrentQuestion(): Promise<QuestionWithAnswers | null> {
  const question = await db.question.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    include: questionInclude,
  })

  if (!question) return null
  return sortAnswersByScore(question as QuestionWithAnswers)
}

export async function getQuestionBySlug(slug: string): Promise<QuestionWithAnswers | null> {
  const question = await db.question.findUnique({
    where: { slug },
    include: questionInclude,
  })

  if (!question) return null
  return sortAnswersByScore(question as QuestionWithAnswers)
}

export async function getUserAnsweredQuestionIds(userId: string): Promise<Set<string>> {
  const answers = await db.answer.findMany({
    where: { userId },
    select: { questionId: true },
  })
  return new Set(answers.map(a => a.questionId))
}

export type ArchivedQuestionsFilter = 'todas' | 'respondidas' | 'nao-respondidas'

export async function getArchivedQuestions(
  page: number = 1,
  limit: number = 20,
  filter: ArchivedQuestionsFilter = 'todas',
  answeredIds?: Set<string>
) {
  const skip = (page - 1) * limit

  const baseWhere = { status: 'PUBLISHED' as const, slug: { not: null } }

  let filterWhere = {}
  if (filter === 'respondidas' && answeredIds) {
    filterWhere = { id: { in: Array.from(answeredIds) } }
  } else if (filter === 'nao-respondidas' && answeredIds) {
    filterWhere = { id: { notIn: Array.from(answeredIds) } }
  }

  const where = { ...baseWhere, ...filterWhere }

  const [questions, total] = await Promise.all([
    db.question.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        content: true,
        publishedAt: true,
        _count: { select: { answers: true } },
      },
    }),
    db.question.count({ where }),
  ])

  return {
    questions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
