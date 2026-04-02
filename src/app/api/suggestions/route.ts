import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { rateLimitSuggestion } from '@/lib/rate-limit'
import { filterContent } from '@/lib/content-filter'
import { z } from 'zod'

const suggestionSchema = z.object({
  content: z
    .string()
    .min(10, 'A sugestão deve ter pelo menos 10 caracteres.')
    .max(500, 'A sugestão deve ter no máximo 500 caracteres.'),
})

// GET - List suggestions (public)
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort') || 'votes' // 'votes' or 'recent'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const skip = (page - 1) * limit

    const where = { deletedByMod: false }

    const suggestions = await db.suggestion.findMany({
      where,
      orderBy: sort === 'recent' ? { createdAt: 'desc' } : undefined,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        votes: true,
        _count: { select: { votes: true } },
      },
    })

    // If sorting by votes, we need to calculate net score and sort manually
    const suggestionsWithScore = suggestions.map((s) => {
      const upvotes = s.votes.filter((v) => v.value === 1).length
      const downvotes = s.votes.filter((v) => v.value === -1).length
      const userVote = session?.user?.id
        ? s.votes.find((v) => v.userId === session.user.id)?.value ?? null
        : null

      return {
        id: s.id,
        content: s.content,
        postedByAdmin: s.postedByAdmin,
        createdAt: s.createdAt,
        user: s.user,
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        userVote,
      }
    })

    if (sort === 'votes') {
      suggestionsWithScore.sort((a, b) => b.score - a.score)
    }

    const total = await db.suggestion.count({ where })

    return NextResponse.json({
      success: true,
      data: {
        suggestions: suggestionsWithScore,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/suggestions]', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}

// POST - Create suggestion (authenticated)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = suggestionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { content } = parsed.data

    // Rate limit
    const rateLimitResult = await rateLimitSuggestion(session.user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Muitas sugestões. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    // Content filter
    const filterResult = filterContent(content)
    if (!filterResult.valid) {
      return NextResponse.json(
        { success: false, error: `Conteúdo não permitido: ${filterResult.reason}` },
        { status: 400 }
      )
    }

    const suggestion = await db.suggestion.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        postedByAdmin: session.user.role === 'ADMIN',
      },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: suggestion.id,
          content: suggestion.content,
          postedByAdmin: suggestion.postedByAdmin,
          createdAt: suggestion.createdAt,
          user: suggestion.user,
          upvotes: 0,
          downvotes: 0,
          score: 0,
          userVote: null,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/suggestions]', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
