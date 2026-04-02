import { NextRequest, NextResponse } from 'next/server'
import { sendDailyDigest } from '@/lib/email'
import { notifyDailyQuestion } from '@/lib/notifications'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Notify in-app for today's question
  const todayQuestion = await db.question.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    select: { id: true, slug: true },
  })

  if (todayQuestion?.slug) {
    await notifyDailyQuestion(todayQuestion.id, todayQuestion.slug)
  }

  // Send digest emails
  const result = await sendDailyDigest()

  return NextResponse.json({ success: true, ...result })
}
