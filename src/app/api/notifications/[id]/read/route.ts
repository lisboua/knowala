import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
  }

  const notification = await db.notification.findUnique({ where: { id: params.id } })
  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Notificação não encontrada.' }, { status: 404 })
  }

  await db.notification.update({ where: { id: params.id }, data: { read: true } })

  return NextResponse.json({ success: true })
}
