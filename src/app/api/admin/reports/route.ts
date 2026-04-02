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

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'PENDING'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const [reports, total] = await Promise.all([
    db.report.findMany({
      where: { status: status as 'PENDING' | 'RESOLVED' },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, username: true } },
        answer: {
          select: {
            id: true,
            content: true,
            deletedByMod: true,
            user: { select: { name: true, username: true } },
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            deletedByMod: true,
            user: { select: { name: true, username: true } },
          },
        },
        suggestion: {
          select: {
            id: true,
            content: true,
            deletedByMod: true,
            user: { select: { name: true, username: true } },
          },
        },
      },
    }),
    db.report.count({ where: { status: status as 'PENDING' | 'RESOLVED' } }),
  ])

  return NextResponse.json({
    success: true,
    data: { reports, total, page, totalPages: Math.ceil(total / limit) },
  })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin(req)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 })
  }

  const body = await req.json()
  const schema = z.object({
    reportId: z.string().cuid(),
    action: z.enum(['resolve', 'resolve_and_delete']),
  })

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 })
  }

  const { reportId, action } = parsed.data

  const report = await db.report.findUnique({ where: { id: reportId } })
  if (!report) {
    return NextResponse.json({ success: false, error: 'Denúncia não encontrada.' }, { status: 404 })
  }

  if (action === 'resolve_and_delete') {
    if (report.targetType === 'ANSWER' && report.answerId) {
      await db.answer.update({
        where: { id: report.answerId },
        data: { deletedByMod: true },
      })
      // Resolve all reports for this answer
      await db.report.updateMany({
        where: { answerId: report.answerId, targetType: 'ANSWER' },
        data: { status: 'RESOLVED' },
      })
    } else if (report.targetType === 'COMMENT' && report.commentId) {
      await db.comment.update({
        where: { id: report.commentId },
        data: { deletedByMod: true },
      })
      await db.report.updateMany({
        where: { commentId: report.commentId, targetType: 'COMMENT' },
        data: { status: 'RESOLVED' },
      })
    } else if (report.targetType === 'SUGGESTION' && report.suggestionId) {
      await db.suggestion.update({
        where: { id: report.suggestionId },
        data: { deletedByMod: true },
      })
      await db.report.updateMany({
        where: { suggestionId: report.suggestionId, targetType: 'SUGGESTION' },
        data: { status: 'RESOLVED' },
      })
    }
  } else {
    await db.report.update({
      where: { id: reportId },
      data: { status: 'RESOLVED' },
    })
  }

  return NextResponse.json({ success: true, message: 'Denúncia processada com sucesso.' })
}
