import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type SearchResult = {
  id: string
  content: string
  slug: string | null
  publishedAt: Date | null
  answerCount: bigint
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '10'), 50)

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const results = await db.$queryRaw<SearchResult[]>`
    SELECT
      q.id,
      q.content,
      q.slug,
      q."publishedAt",
      COUNT(a.id) AS "answerCount"
    FROM "Question" q
    LEFT JOIN "Answer" a ON a."questionId" = q.id
    WHERE q.status = 'PUBLISHED'
      AND to_tsvector('simple', q.content) @@ plainto_tsquery('simple', ${q})
    GROUP BY q.id
    ORDER BY ts_rank(to_tsvector('simple', q.content), plainto_tsquery('simple', ${q})) DESC
    LIMIT ${limit}
  `

  return NextResponse.json({
    results: results.map((r) => ({
      id: r.id,
      content: r.content,
      slug: r.slug,
      publishedAt: r.publishedAt,
      answerCount: Number(r.answerCount),
    })),
  })
}
