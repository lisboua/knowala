import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { filterContent } from '@/lib/content-filter'
import { z } from 'zod'

const updateSchema = z.object({
  content: z
    .string()
    .min(10, 'A sugestão deve ter pelo menos 10 caracteres.')
    .max(500, 'A sugestão deve ter no máximo 500 caracteres.'),
})

// PUT - Update own suggestion
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
    }

    const suggestion = await db.suggestion.findUnique({ where: { id: params.id } })

    if (!suggestion || suggestion.deletedByMod) {
      return NextResponse.json({ success: false, error: 'Sugestão não encontrada.' }, { status: 404 })
    }

    if (suggestion.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Sem permissão para editar.' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { content } = parsed.data

    const filterResult = filterContent(content)
    if (!filterResult.valid) {
      return NextResponse.json(
        { success: false, error: `Conteúdo não permitido: ${filterResult.reason}` },
        { status: 400 }
      )
    }

    const updated = await db.suggestion.update({
      where: { id: params.id },
      data: { content: content.trim() },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[PUT /api/suggestions/[id]]', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

// DELETE - Delete own suggestion
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
    }

    const suggestion = await db.suggestion.findUnique({ where: { id: params.id } })

    if (!suggestion || suggestion.deletedByMod) {
      return NextResponse.json({ success: false, error: 'Sugestão não encontrada.' }, { status: 404 })
    }

    if (suggestion.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Sem permissão para deletar.' }, { status: 403 })
    }

    // Hard delete the suggestion, its votes and reports
    await db.suggestionVote.deleteMany({ where: { suggestionId: params.id } })
    await db.report.deleteMany({ where: { suggestionId: params.id } })
    await db.suggestion.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'Sugestão removida.' })
  } catch (error) {
    console.error('[DELETE /api/suggestions/[id]]', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
