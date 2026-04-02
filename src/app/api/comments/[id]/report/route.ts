import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { rateLimitReport } from '@/lib/rate-limit'
import { z } from 'zod'

const reportSchema = z.object({
  reason: z.string().min(10, 'Por favor, explique o motivo (mínimo 10 caracteres).').max(500, 'Motivo muito longo.'),
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
    const parsed = reportSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { reason } = parsed.data
    const commentId = params.id

    const comment = await db.comment.findUnique({ where: { id: commentId } })
    if (!comment || comment.deletedByMod) {
      return NextResponse.json({ success: false, error: 'Comentário não encontrado.' }, { status: 404 })
    }

    const rateLimitResult = await rateLimitReport(session.user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: 'Muitas denúncias. Tente novamente.' }, { status: 429 })
    }

    const existing = await db.report.findFirst({
      where: {
        userId: session.user.id,
        commentId,
        targetType: 'COMMENT',
      },
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'Você já denunciou este comentário.' }, { status: 409 })
    }

    await db.report.create({
      data: {
        userId: session.user.id,
        commentId,
        targetType: 'COMMENT',
        reason,
      },
    })

    return NextResponse.json({ success: true, message: 'Denúncia enviada.' })
  } catch (error) {
    console.error('[POST /api/comments/[id]/report]', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
