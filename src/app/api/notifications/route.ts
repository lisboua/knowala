import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteExpiredNotifications } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
  }

  // Opportunistically clean up expired notifications
  deleteExpiredNotifications().catch(console.error)

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id, expiresAt: { gt: new Date() }, NOT: { type: 'DAILY_QUESTION' } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      actor: { select: { name: true, username: true, image: true } },
    },
  })

  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, read: false, expiresAt: { gt: new Date() }, NOT: { type: 'DAILY_QUESTION' } },
  })

  return NextResponse.json({ success: true, data: { notifications, unreadCount } })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
  }

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}
