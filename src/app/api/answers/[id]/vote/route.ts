import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { rateLimitVote } from '@/lib/rate-limit'
import { updateUserEcoScore } from '@/lib/score'
import { checkAndAwardBadges } from '@/lib/badges'
import { notifyAnswerUpvote } from '@/lib/notifications'
import { z } from 'zod'

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = voteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Valor de voto inválido.' },
        { status: 400 }
      )
    }

    const { value } = parsed.data
    const answerId = params.id

    // Check answer exists
    const answer = await db.answer.findUnique({
      where: { id: answerId },
      include: { question: { select: { slug: true } } },
    })

    if (!answer || answer.deletedByMod) {
      return NextResponse.json(
        { success: false, error: 'Resposta não encontrada.' },
        { status: 404 }
      )
    }

    // Prevent voting on own answer
    if (answer.userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Você não pode votar na sua própria resposta.' },
        { status: 400 }
      )
    }

    // Rate limit check
    const rateLimitResult = await rateLimitVote(session.user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Muitos votos. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    // value 0 means remove vote
    if (value === 0) {
      await db.vote.deleteMany({
        where: {
          userId: session.user.id,
          answerId,
          targetType: 'ANSWER',
        },
      })
    } else {
      // Upsert vote
      await db.vote.upsert({
        where: {
          userId_answerId_targetType: {
            userId: session.user.id,
            answerId,
            targetType: 'ANSWER',
          },
        },
        update: { value },
        create: {
          userId: session.user.id,
          answerId,
          targetType: 'ANSWER',
          value,
        },
      })
    }

    // Update score for answer author
    updateUserEcoScore(answer.userId).catch(console.error)
    checkAndAwardBadges(answer.userId).catch(console.error)

    // Get updated vote counts
    const [upvotes, downvotes] = await Promise.all([
      db.vote.count({ where: { answerId, targetType: 'ANSWER', value: 1 } }),
      db.vote.count({ where: { answerId, targetType: 'ANSWER', value: -1 } }),
    ])

    // Notify answer owner of upvote (fire-and-forget)
    if (value === 1 && answer.question.slug) {
      notifyAnswerUpvote({
        actorId: session.user.id,
        answerId,
        answerOwnerId: answer.userId,
        questionSlug: answer.question.slug,
        upvoteCount: upvotes,
      }).catch(console.error)
    }

    const userVote = value !== 0 ? value : null

    return NextResponse.json({
      success: true,
      data: {
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        userVote,
      },
    })
  } catch (error) {
    console.error('[POST /api/answers/[id]/vote]', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
