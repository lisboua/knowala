import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { filterContent, sanitizeText } from '@/lib/content-filter'
import { rateLimitAnswer } from '@/lib/rate-limit'
import { updateUserEcoScore } from '@/lib/score'
import { checkAndAwardBadges } from '@/lib/badges'
import { z } from 'zod'

const answerSchema = z.object({
  content: z.string().min(10, 'Resposta muito curta (mínimo 10 caracteres).').max(5000, 'Resposta muito longa (máximo 5000 caracteres).'),
  questionId: z.string().cuid('ID de pergunta inválido.'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Você precisa estar logado para responder.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = answerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { content, questionId } = parsed.data

    // Check question exists and is published
    const question = await db.question.findUnique({
      where: { id: questionId, status: 'PUBLISHED' },
    })

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Pergunta não encontrada ou não está publicada.' },
        { status: 404 }
      )
    }

    // Rate limit check
    const rateLimitResult = await rateLimitAnswer(session.user.id, questionId)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Você já respondeu esta pergunta.' },
        { status: 429 }
      )
    }

    // Content filter
    const sanitized = sanitizeText(content)
    const filterResult = filterContent(sanitized)

    if (!filterResult.valid) {
      return NextResponse.json(
        { success: false, error: filterResult.reason },
        { status: 400 }
      )
    }

    // Check if user already answered this question
    const existingAnswer = await db.answer.findUnique({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
    })

    if (existingAnswer) {
      return NextResponse.json(
        { success: false, error: 'Você já respondeu esta pergunta.' },
        { status: 409 }
      )
    }

    // Create answer
    const answer = await db.answer.create({
      data: {
        content: sanitized,
        userId: session.user.id,
        questionId,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true, ecoScore: true },
        },
        votes: true,
        comments: {
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
        },
      },
    })

    // Update eco score and check badges asynchronously
    updateUserEcoScore(session.user.id).catch(console.error)
    checkAndAwardBadges(session.user.id).catch(console.error)

    return NextResponse.json({ success: true, data: answer }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/answers]', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
