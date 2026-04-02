import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

async function requireAdmin(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

const deleteSchema = z.object({
  targetId: z.string().cuid(),
  targetType: z.enum(['ANSWER', 'COMMENT', 'SUGGESTION']),
})

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = deleteSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 })
  }

  const { targetId, targetType } = parsed.data

  if (targetType === 'ANSWER') {
    const answer = await db.answer.findUnique({ where: { id: targetId } })
    if (!answer) {
      return NextResponse.json({ success: false, error: 'Resposta não encontrada.' }, { status: 404 })
    }

    await db.answer.update({
      where: { id: targetId },
      data: { deletedByMod: true },
    })

    // Also resolve any pending reports
    await db.report.updateMany({
      where: { answerId: targetId, targetType: 'ANSWER', status: 'PENDING' },
      data: { status: 'RESOLVED' },
    })
  } else if (targetType === 'COMMENT') {
    const comment = await db.comment.findUnique({ where: { id: targetId } })
    if (!comment) {
      return NextResponse.json({ success: false, error: 'Comentário não encontrado.' }, { status: 404 })
    }

    await db.comment.update({
      where: { id: targetId },
      data: { deletedByMod: true },
    })

    await db.report.updateMany({
      where: { commentId: targetId, targetType: 'COMMENT', status: 'PENDING' },
      data: { status: 'RESOLVED' },
    })
  } else if (targetType === 'SUGGESTION') {
    const suggestion = await db.suggestion.findUnique({ where: { id: targetId } })
    if (!suggestion) {
      return NextResponse.json({ success: false, error: 'Sugestão não encontrada.' }, { status: 404 })
    }

    await db.suggestion.update({
      where: { id: targetId },
      data: { deletedByMod: true },
    })

    await db.report.updateMany({
      where: { suggestionId: targetId, targetType: 'SUGGESTION', status: 'PENDING' },
      data: { status: 'RESOLVED' },
    })
  }

  return NextResponse.json({ success: true, message: 'Conteúdo removido pela moderação.' })
}
