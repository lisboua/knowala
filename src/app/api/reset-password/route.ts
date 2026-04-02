import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { verifyPasswordResetToken } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório.'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número.'),
})

async function rateLimitResetPassword(ip: string) {
  return rateLimit({
    key: `reset-password:${ip}`,
    limit: 5,
    windowSeconds: 900, // 15 minutes
  })
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    const rateLimitResult = await rateLimitResetPassword(ip)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data

    const tokenResult = await verifyPasswordResetToken(token)
    if (!tokenResult.success) {
      return NextResponse.json(
        { success: false, error: tokenResult.error },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await db.$transaction([
      db.user.update({
        where: { id: tokenResult.userId },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.update({
        where: { token },
        data: { used: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso.',
    })
  } catch (error) {
    console.error('[ResetPassword] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno. Tente novamente.' },
      { status: 500 }
    )
  }
}
