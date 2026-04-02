import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido.').transform((v) => v.toLowerCase().trim()),
})

async function rateLimitForgotPassword(ip: string) {
  return rateLimit({
    key: `forgot-password:${ip}`,
    limit: 3,
    windowSeconds: 900, // 15 minutes
  })
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    const rateLimitResult = await rateLimitForgotPassword(ip)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
    })

    const user = await db.user.findUnique({ where: { email } })

    // User not found
    if (!user) {
      return successResponse
    }

    // Google-only user: informa para usar o login social (não revela se o e-mail existe)
    if (!user.password) {
      return NextResponse.json({
        success: false,
        error: 'Esta conta usa login com Google. Entre usando o botão "Continuar com Google".',
      }, { status: 400 })
    }

    await sendPasswordResetEmail(user.id, user.email, user.name)

    return successResponse
  } catch (error) {
    console.error('[ForgotPassword] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno. Tente novamente.' },
      { status: 500 }
    )
  }
}
