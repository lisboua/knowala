import { NextRequest, NextResponse } from 'next/server'
import { seedBadges, checkAndAwardBadges } from '@/lib/badges'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
  }

  // 1. Seed badge definitions
  await seedBadges()

  // 2. Retroactively check badges for all users who have at least one answer
  const users = await db.user.findMany({
    where: { answers: { some: {} } },
    select: { id: true },
  })

  let awarded = 0
  for (const user of users) {
    const before = await db.userBadge.count({ where: { userId: user.id } })
    await checkAndAwardBadges(user.id)
    const after = await db.userBadge.count({ where: { userId: user.id } })
    awarded += after - before
  }

  return NextResponse.json({ success: true, usersChecked: users.length, badgesAwarded: awarded })
}
