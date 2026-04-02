import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken, sendWelcomeEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(
      new URL('/verify-email?error=missing_token', req.url)
    )
  }

  const result = await verifyEmailToken(token)

  if (!result.success) {
    const errorParam = encodeURIComponent(result.error || 'Erro desconhecido')
    return NextResponse.redirect(
      new URL(`/verify-email?error=${errorParam}`, req.url)
    )
  }

  // Send welcome email in background — don't block the redirect
  if (result.user) {
    sendWelcomeEmail(result.user.id, result.user.email, result.user.name).catch((err) =>
      console.error('[verify-email] failed to send welcome email:', err)
    )
  }

  return NextResponse.redirect(
    new URL('/login?verified=true', req.url)
  )
}
