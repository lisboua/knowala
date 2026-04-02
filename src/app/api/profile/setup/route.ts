import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { isValidAvatar } from '@/lib/avatars'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { username, avatar } = await req.json()

  if (!username || typeof username !== 'string') {
    return NextResponse.json({ error: 'Username inválido' }, { status: 400 })
  }

  const clean = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '')
  if (clean.length < 3 || clean.length > 20) {
    return NextResponse.json({ error: 'Username deve ter entre 3 e 20 caracteres' }, { status: 400 })
  }

  if (!avatar || !isValidAvatar(avatar)) {
    return NextResponse.json({ error: 'Avatar inválido' }, { status: 400 })
  }

  const existing = await db.user.findFirst({
    where: { username: clean, NOT: { id: session.user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Username já está em uso' }, { status: 409 })
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { username: clean, image: avatar, needsOnboarding: false },
  })

  return NextResponse.json({ ok: true })
}
