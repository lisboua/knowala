import { NextRequest, NextResponse } from 'next/server'
import { updateUserEcoScore } from '@/lib/score'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
  }

  const users = await db.user.findMany({ select: { id: true } })

  let updated = 0
  for (const user of users) {
    await updateUserEcoScore(user.id)
    updated++
  }

  return NextResponse.json({ success: true, usersUpdated: updated })
}
