import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/unsubscribe?error=token_missing', req.url))
  }

  const user = await db.user.findUnique({ where: { emailDigestToken: token } })

  if (!user) {
    return NextResponse.redirect(new URL('/unsubscribe?error=invalid_token', req.url))
  }

  if (!user.emailDigest) {
    return NextResponse.redirect(new URL(`/unsubscribe?status=already_unsubscribed&token=${token}`, req.url))
  }

  await db.user.update({ where: { id: user.id }, data: { emailDigest: false } })

  return NextResponse.redirect(new URL(`/unsubscribe?status=success&token=${token}`, req.url))
}

export async function POST(req: NextRequest) {
  const { token } = await req.json()

  if (!token) {
    return NextResponse.json({ success: false, error: 'Token inválido.' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { emailDigestToken: token } })
  if (!user) {
    return NextResponse.json({ success: false, error: 'Token inválido.' }, { status: 404 })
  }

  await db.user.update({ where: { id: user.id }, data: { emailDigest: true } })

  return NextResponse.json({ success: true })
}
