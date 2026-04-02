import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { rateLimitVote } from '@/lib/rate-limit'
import { updateUserEcoScore } from '@/lib/score'
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
      return NextResponse.json({ success: false, error: 'Valor de voto inválido.' }, { status: 400 })
    }

    const { value } = parsed.data
    const commentId = params.id

    const comment = await db.comment.findUnique({ where: { id: commentId } })
    if (!comment || comment.deletedByMod) {
      return NextResponse.json({ success: false, error: 'Comentário não encontrado.' }, { status: 404 })
    }

    if (comment.userId === session.user.id) {
      return NextResponse.json({ success: false, error: 'Você não pode votar no seu próprio comentário.' }, { status: 400 })
    }

    const rateLimitResult = await rateLimitVote(session.user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: 'Muitos votos. Tente novamente mais tarde.' }, { status: 429 })
    }

    if (value === 0) {
      await db.vote.deleteMany({
        where: { userId: session.user.id, commentId, targetType: 'COMMENT' },
      })
    } else {
      await db.vote.upsert({
        where: {
          userId_commentId_targetType: {
            userId: session.user.id,
            commentId,
            targetType: 'COMMENT',
          },
        },
        update: { value },
        create: {
          userId: session.user.id,
          commentId,
          targetType: 'COMMENT',
          value,
        },
      })
    }

    updateUserEcoScore(comment.userId).catch(console.error)

    const [upvotes, downvotes] = await Promise.all([
      db.vote.count({ where: { commentId, targetType: 'COMMENT', value: 1 } }),
      db.vote.count({ where: { commentId, targetType: 'COMMENT', value: -1 } }),
    ])

    return NextResponse.json({
      success: true,
      data: { upvotes, downvotes, score: upvotes - downvotes, userVote: value !== 0 ? value : null },
    })
  } catch (error) {
    console.error('[POST /api/comments/[id]/vote]', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
