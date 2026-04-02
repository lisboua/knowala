import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { rateLimitVote } from '@/lib/rate-limit'
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
    const suggestionId = params.id

    const suggestion = await db.suggestion.findUnique({ where: { id: suggestionId } })

    if (!suggestion || suggestion.deletedByMod) {
      return NextResponse.json({ success: false, error: 'Sugestão não encontrada.' }, { status: 404 })
    }

    // Prevent voting on own suggestion
    if (suggestion.userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Você não pode votar na sua própria sugestão.' },
        { status: 400 }
      )
    }

    const rateLimitResult = await rateLimitVote(session.user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Muitos votos. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    if (value === 0) {
      await db.suggestionVote.deleteMany({
        where: { userId: session.user.id, suggestionId },
      })
    } else {
      await db.suggestionVote.upsert({
        where: {
          userId_suggestionId: {
            userId: session.user.id,
            suggestionId,
          },
        },
        update: { value },
        create: {
          userId: session.user.id,
          suggestionId,
          value,
        },
      })
    }

    const [upvotes, downvotes] = await Promise.all([
      db.suggestionVote.count({ where: { suggestionId, value: 1 } }),
      db.suggestionVote.count({ where: { suggestionId, value: -1 } }),
    ])

    const userVote = value !== 0 ? value : null

    return NextResponse.json({
      success: true,
      data: { upvotes, downvotes, score: upvotes - downvotes, userVote },
    })
  } catch (error) {
    console.error('[POST /api/suggestions/[id]/vote]', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
