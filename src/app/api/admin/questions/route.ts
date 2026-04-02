import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { generateUniqueSlug } from '@/lib/slug'

const questionSchema = z.object({
  content: z.string().min(10, 'Pergunta muito curta.').max(1000, 'Pergunta muito longa.'),
  scheduledFor: z.string().datetime().optional().nullable(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']).default('DRAFT'),
})

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
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const [questions, total] = await Promise.all([
    db.question.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: { select: { answers: true } },
      },
    }),
    db.question.count(),
  ])

  return NextResponse.json({
    success: true,
    data: { questions, total, page, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = questionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  const { content, scheduledFor, status } = parsed.data

  const publishedAt = status === 'PUBLISHED' ? new Date() : null
  const slug = status === 'PUBLISHED'
    ? await generateUniqueSlug(content, publishedAt!)
    : null

  const question = await db.question.create({
    data: {
      content,
      slug,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      status,
      publishedAt,
    },
  })

  return NextResponse.json({ success: true, data: question }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin(req)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 })
  }

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID da pergunta obrigatório.' }, { status: 400 })
  }

  const parsed = questionSchema.partial().safeParse(updates)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { ...parsed.data }

  if (parsed.data.status === 'PUBLISHED' && !updates.publishedAt) {
    const publishedAt = new Date()
    updateData.publishedAt = publishedAt

    // Generate slug if not yet set
    const existing = await db.question.findUnique({ where: { id } })
    if (existing && !existing.slug) {
      updateData.slug = await generateUniqueSlug(existing.content, publishedAt)
    }
  }

  if (updates.scheduledFor) {
    updateData.scheduledFor = new Date(updates.scheduledFor)
  }

  const question = await db.question.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ success: true, data: question })
}
