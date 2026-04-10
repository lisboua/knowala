import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { filterContent, sanitizeText } from '@/lib/content-filter'
import { z } from 'zod'

const editSchema = z.object({
  content: z
    .string()
    .min(2, 'Comentário muito curto.')
    .max(1000, 'Comentário muito longo (máximo 1000 caracteres).'),
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

    const comment = await db.comment.findUnique({ where: { id } })
    if (!comment) {
      return NextResponse.json({ success: false, error: 'Comentário não encontrado.' }, { status: 404 })
    }
    if (comment.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Sem permissão para editar este comentário.' }, { status: 403 })
    }
    if (comment.deletedByMod) {
      return NextResponse.json({ success: false, error: 'Este comentário foi removido pela moderação.' }, { status: 403 })
    }

    const sanitized = sanitizeText(parsed.data.content)
    const filterResult = filterContent(sanitized)
    if (!filterResult.valid) {
      return NextResponse.json({ success: false, error: filterResult.reason }, { status: 400 })
    }

    const updated = await db.comment.update({
      where: { id },
      data: { content: sanitized, editedAt: new Date() },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[PATCH /api/comments/[id]]', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
