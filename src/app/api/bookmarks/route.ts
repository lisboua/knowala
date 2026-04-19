import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookmarkTargetType, Prisma } from '@prisma/client'
import { z } from 'zod'

const PER_PAGE = 20

const bodySchema = z.object({
  targetType: z.enum(['QUESTION', 'ANSWER', 'COMMENT']),
  targetId: z.string().cuid(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const url = new URL(req.url)
  const tipoParam = (url.searchParams.get('tipo') || 'QUESTION').toUpperCase()
  const pagina = Math.max(1, parseInt(url.searchParams.get('pagina') || '1'))

  if (!['QUESTION', 'ANSWER', 'COMMENT'].includes(tipoParam)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  const targetType = tipoParam as BookmarkTargetType

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const includeSpec: Record<string, any> = {}
  if (targetType === 'QUESTION') {
    includeSpec.question = {
      select: {
        id: true, content: true, slug: true, publishedAt: true,
        _count: { select: { answers: true } },
      },
    }
  } else if (targetType === 'ANSWER') {
    includeSpec.answer = {
      include: {
        user: { select: { id: true, name: true, username: true } },
        question: { select: { id: true, content: true, slug: true } },
      },
    }
  } else {
    includeSpec.comment = {
      include: {
        user: { select: { id: true, name: true, username: true } },
        answer: {
          include: {
            question: { select: { id: true, content: true, slug: true } },
          },
        },
      },
    }
  }

  const [items, total] = await Promise.all([
    db.bookmark.findMany({
      where: { userId: session.user.id, targetType },
      orderBy: { createdAt: 'desc' },
      skip: (pagina - 1) * PER_PAGE,
      take: PER_PAGE,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      include: includeSpec as any,
    }),
    db.bookmark.count({ where: { userId: session.user.id, targetType } }),
  ])

  return NextResponse.json({
    data: items,
    total,
    totalPages: Math.ceil(total / PER_PAGE),
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { targetType, targetId } = parsed.data

  const data: Prisma.BookmarkCreateInput = {
    user: { connect: { id: session.user.id } },
    targetType,
    ...(targetType === 'QUESTION' && { question: { connect: { id: targetId } } }),
    ...(targetType === 'ANSWER' && { answer: { connect: { id: targetId } } }),
    ...(targetType === 'COMMENT' && { comment: { connect: { id: targetId } } }),
  }

  try {
    await db.bookmark.create({ data })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      // already bookmarked — idempotent
    } else {
      throw e
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { targetType, targetId } = parsed.data

  await db.bookmark.deleteMany({
    where: {
      userId: session.user.id,
      targetType,
      ...(targetType === 'QUESTION' && { questionId: targetId }),
      ...(targetType === 'ANSWER' && { answerId: targetId }),
      ...(targetType === 'COMMENT' && { commentId: targetId }),
    },
  })

  return NextResponse.json({ success: true })
}
