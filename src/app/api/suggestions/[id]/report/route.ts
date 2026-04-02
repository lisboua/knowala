import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { rateLimitReport } from '@/lib/rate-limit'
import { z } from 'zod'

const reportSchema = z.object({
  reason: z.string().min(10, 'Por favor, explique o motivo da denúncia (mínimo 10 caracteres).').max(500, 'Motivo muito longo.'),
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
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { reason } = parsed.data
    const suggestionId = params.id

    const suggestion = await db.suggestion.findUnique({ where: { id: suggestionId } })
    if (!suggestion || suggestion.deletedByMod) {
      return NextResponse.json({ success: false, error: 'Sugestão não encontrada.' }, { status: 404 })
    }

    const rateLimitResult = await rateLimitReport(session.user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Muitas denúncias. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    const existing = await db.report.findFirst({
      where: { userId: session.user.id, suggestionId, targetType: 'SUGGESTION' },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Você já denunciou esta sugestão.' },
        { status: 409 }
      )
    }

    await db.report.create({
      data: {
        userId: session.user.id,
        suggestionId,
        targetType: 'SUGGESTION',
        reason,
      },
    })

    return NextResponse.json({ success: true, message: 'Denúncia enviada com sucesso.' })
  } catch (error) {
    console.error('[POST /api/suggestions/[id]/report]', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
