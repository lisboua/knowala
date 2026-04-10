import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { filterContent, sanitizeText } from '@/lib/content-filter'
import { z } from 'zod'

const editSchema = z.object({
  content: z
    .string()
    .min(10, 'Resposta muito curta (mínimo 10 caracteres).')
    .max(5000, 'Resposta muito longa (máximo 5000 caracteres).'),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = editSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const answer = await db.answer.findUnique({ where: { id } })
    if (!answer) {
      return NextResponse.json({ success: false, error: 'Resposta não encontrada.' }, { status: 404 })
    }
    if (answer.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Sem permissão para editar esta resposta.' }, { status: 403 })
    }
    if (answer.deletedByMod) {
      return NextResponse.json({ success: false, error: 'Esta resposta foi removida pela moderação.' }, { status: 403 })
    }

    const sanitized = sanitizeText(parsed.data.content)
    const filterResult = filterContent(sanitized)
    if (!filterResult.valid) {
      return NextResponse.json({ success: false, error: filterResult.reason }, { status: 400 })
    }

    const updated = await db.answer.update({
      where: { id },
      data: { content: sanitized, editedAt: new Date() },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[PATCH /api/answers/[id]]', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
