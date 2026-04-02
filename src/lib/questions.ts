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

export async function getArchivedQuestions(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit

  const [questions, total] = await Promise.all([
    db.question.findMany({
      where: { status: 'PUBLISHED', slug: { not: null } },
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
    db.question.count({
      where: { status: 'PUBLISHED', slug: { not: null } },
    }),
  ])

  return {
    questions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
