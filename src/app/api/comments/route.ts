import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { filterContent, sanitizeText } from '@/lib/content-filter'
import { rateLimitComment } from '@/lib/rate-limit'
import { checkAndAwardBadges } from '@/lib/badges'
import { notifyAnswerComment, notifyCommentReply } from '@/lib/notifications'
import { z } from 'zod'

const commentSchema = z.object({
  content: z.string().min(2, 'Comentário muito curto.').max(1000, 'Comentário muito longo (máximo 1000 caracteres).'),
  answerId: z.string().cuid('ID de resposta inválido.'),
  parentId: z.string().cuid('ID de comentário pai inválido.').optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Você precisa estar logado para comentar.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = commentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { content, answerId, parentId } = parsed.data

    // Rate limit
    const rateLimitResult = await rateLimitComment(session.user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Muitos comentários. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    // Check answer exists
    const answer = await db.answer.findUnique({
      where: { id: answerId },
      include: { question: { select: { slug: true } } },
    })
    if (!answer || answer.deletedByMod) {
      return NextResponse.json({ success: false, error: 'Resposta não encontrada.' }, { status: 404 })
    }

    // Check parent comment if provided
    if (parentId) {
      const parentComment = await db.comment.findUnique({ where: { id: parentId } })
      if (!parentComment || parentComment.deletedByMod) {
        return NextResponse.json({ success: false, error: 'Comentário pai não encontrado.' }, { status: 404 })
      }
      // Only allow one level of nesting
      if (parentComment.parentId) {
        return NextResponse.json({ success: false, error: 'Não é possível responder a uma resposta de comentário.' }, { status: 400 })
      }
    }

    // Content filter
    const sanitized = sanitizeText(content)
    const filterResult = filterContent(sanitized)
    if (!filterResult.valid) {
      return NextResponse.json({ success: false, error: filterResult.reason }, { status: 400 })
    }

    const comment = await db.comment.create({
      data: {
        content: sanitized,
        userId: session.user.id,
        answerId,
        parentId: parentId || null,
      },
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
    })

    // Check badges asynchronously
    checkAndAwardBadges(session.user.id).catch(console.error)

    // Fire notifications (fire-and-forget)
    if (answer.question.slug) {
      if (parentId) {
        // This is a reply — notify parent comment owner
        const parentComment = await db.comment.findUnique({
          where: { id: parentId },
          select: { userId: true },
        })
        if (parentComment) {
          notifyCommentReply({
            actorId: session.user.id,
            commentId: comment.id,
            parentOwnerId: parentComment.userId,
            questionSlug: answer.question.slug,
          }).catch(console.error)
        }
      } else {
        // Top-level comment — notify answer owner
        notifyAnswerComment({
          actorId: session.user.id,
          commentId: comment.id,
          answerId,
          answerOwnerId: answer.userId,
          questionSlug: answer.question.slug,
        }).catch(console.error)
      }
    }

    return NextResponse.json({ success: true, data: comment }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/comments]', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
