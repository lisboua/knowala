import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateUniqueSlug } from '@/lib/slug'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const pending = await db.question.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledFor: { lte: now },
    },
  })

  if (pending.length === 0) {
    return NextResponse.json({ success: true, published: 0 })
  }

  let published = 0
  for (const q of pending) {
    const publishedAt = q.scheduledFor ?? now
    const slug = await generateUniqueSlug(q.content, publishedAt)
    await db.question.update({
      where: { id: q.id },
      data: { status: 'PUBLISHED', publishedAt, slug },
    })
    published++
  }

  return NextResponse.json({ success: true, published })
}
