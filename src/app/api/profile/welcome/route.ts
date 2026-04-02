import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { hasSeenWelcome: true },
  })

  return NextResponse.json({ ok: true })
}
