import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { emailDigest: true, emailWeeklyDigest: true },
  })

  if (!user) return NextResponse.json({ success: false, error: 'Usuário não encontrado.' }, { status: 404 })

  return NextResponse.json({ success: true, emailDigest: user.emailDigest, emailWeeklyDigest: user.emailWeeklyDigest })
}

const schema = z.object({
  emailDigest: z.boolean().optional(),
  emailWeeklyDigest: z.boolean().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 })
  }

  const data: { emailDigest?: boolean; emailWeeklyDigest?: boolean } = {}
  if (parsed.data.emailDigest !== undefined) data.emailDigest = parsed.data.emailDigest
  if (parsed.data.emailWeeklyDigest !== undefined) data.emailWeeklyDigest = parsed.data.emailWeeklyDigest

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: true })
  }

  await db.user.update({ where: { id: session.user.id }, data })

  return NextResponse.json({ success: true })
}
