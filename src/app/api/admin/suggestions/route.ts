import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

// GET - List all suggestions for admin
export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 })
  }

  const suggestions = await db.suggestion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, username: true } },
      votes: { select: { value: true } },
      _count: { select: { votes: true } },
    },
  })

  return NextResponse.json({ success: true, data: suggestions })
}

// PATCH - Toggle postedByAdmin
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 })
  }

  const body = await req.json()
  const schema = z.object({
    suggestionId: z.string().cuid(),
    postedByAdmin: z.boolean(),
  })

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 })
  }

  const { suggestionId, postedByAdmin } = parsed.data

  const suggestion = await db.suggestion.findUnique({ where: { id: suggestionId } })
  if (!suggestion) {
    return NextResponse.json({ success: false, error: 'Sugestão não encontrada.' }, { status: 404 })
  }

  await db.suggestion.update({
    where: { id: suggestionId },
    data: { postedByAdmin },
  })

  return NextResponse.json({ success: true, message: 'Sugestão atualizada.' })
}
