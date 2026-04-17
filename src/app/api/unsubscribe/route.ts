import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const type = req.nextUrl.searchParams.get('type') === 'weekly' ? 'weekly' : 'daily'

  if (!token) {
    return NextResponse.redirect(new URL('/unsubscribe?error=token_missing', req.url))
  }

  const whereClause =
    type === 'weekly'
      ? { emailWeeklyDigestToken: token }
      : { emailDigestToken: token }

  const user = await db.user.findUnique({ where: whereClause })

  if (!user) {
    return NextResponse.redirect(new URL('/unsubscribe?error=invalid_token', req.url))
  }

  if (type === 'weekly') {
    if (!user.emailWeeklyDigest) {
      return NextResponse.redirect(new URL(`/unsubscribe?status=already_unsubscribed&token=${token}&type=weekly`, req.url))
    }
    await db.user.update({ where: { id: user.id }, data: { emailWeeklyDigest: false } })
    return NextResponse.redirect(new URL(`/unsubscribe?status=success&token=${token}&type=weekly`, req.url))
  }

  if (!user.emailDigest) {
    return NextResponse.redirect(new URL(`/unsubscribe?status=already_unsubscribed&token=${token}`, req.url))
  }
  await db.user.update({ where: { id: user.id }, data: { emailDigest: false } })
  return NextResponse.redirect(new URL(`/unsubscribe?status=success&token=${token}`, req.url))
}

export async function POST(req: NextRequest) {
  const { token, type } = await req.json()
  const isWeekly = type === 'weekly'

  if (!token) {
    return NextResponse.json({ success: false, error: 'Token inválido.' }, { status: 400 })
  }

  const whereClause = isWeekly
    ? { emailWeeklyDigestToken: token }
    : { emailDigestToken: token }

  const user = await db.user.findUnique({ where: whereClause })
  if (!user) {
    return NextResponse.json({ success: false, error: 'Token inválido.' }, { status: 404 })
  }

  await db.user.update({
    where: { id: user.id },
    data: isWeekly ? { emailWeeklyDigest: true } : { emailDigest: true },
  })

  return NextResponse.json({ success: true })
}
