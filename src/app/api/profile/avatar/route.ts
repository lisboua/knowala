import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { isValidAvatar } from '@/lib/avatars'

export async function PUT(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const body = await request.json()
  const { avatar } = body

  if (!avatar || typeof avatar !== 'string') {
    return NextResponse.json({ error: 'Avatar inválido.' }, { status: 400 })
  }

  if (!isValidAvatar(avatar)) {
    return NextResponse.json({ error: 'Avatar não disponível.' }, { status: 400 })
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { image: avatar },
  })

  return NextResponse.json({ success: true, image: avatar })
}
