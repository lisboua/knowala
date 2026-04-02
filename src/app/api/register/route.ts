import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimitRegister } from '@/lib/rate-limit'
import { isValidAvatar } from '@/lib/avatars'
import { z } from 'zod'

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Nome de usuário deve ter pelo menos 3 caracteres.')
    .max(20, 'Nome de usuário deve ter no máximo 20 caracteres.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Nome de usuário deve conter apenas letras, números e underline.'),
  email: z.string().email('E-mail inválido.').toLowerCase(),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número.'),
  avatar: z.string().optional(),
  inviteCode: z.string().min(1, 'Código de convite é obrigatório.'),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // Rate limit by IP
    const rateLimitResult = await rateLimitRegister(ip)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { username, email, password, avatar, inviteCode } = parsed.data

    // Validate invite code
    const invite = await db.inviteCode.findUnique({ where: { code: inviteCode } })
    if (!invite || invite.usedById) {
      return NextResponse.json(
        { success: false, error: 'Código de convite inválido ou já utilizado.' },
        { status: 400 }
      )
    }

    // Validate avatar if provided
    if (avatar && !isValidAvatar(avatar)) {
      return NextResponse.json(
        { success: false, error: 'Avatar inválido.' },
        { status: 400 }
      )
    }

    // Check if username is already taken
    const existingUsername = await db.user.findUnique({ where: { username: username.toLowerCase() } })
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Este nome de usuário já está em uso.' },
        { status: 400 }
      )
    }

    // Check if email already exists - always return same success message to prevent enumeration
    const existingUser = await db.user.findUnique({ where: { email } })

    if (existingUser) {
      // Return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'Se este e-mail não estiver cadastrado, você receberá um link de confirmação.',
      })
    }

    // Hash password with cost factor 12
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user (try/catch handles race condition on unique username)
    let user
    try {
      user = await db.user.create({
        data: {
          name: username,
          email,
          password: hashedPassword,
          username: username.toLowerCase(),
          emailVerified: false,
          role: 'USER',
          ecoScore: 0,
          invitesRemaining: 5,
          ...(avatar ? { image: avatar } : {}),
        },
      })

      // Mark invite code as used
      await db.inviteCode.update({
        where: { id: invite.id },
        data: { usedById: user.id, usedAt: new Date() },
      })
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // Prisma unique constraint violation
        return NextResponse.json(
          { success: false, error: 'Este nome de usuário já está em uso.' },
          { status: 400 }
        )
      }
      throw e
    }

    // Send verification email
    try {
      await sendVerificationEmail(user.id, user.email, user.name)
    } catch (emailError) {
      console.error('[Register] Failed to send verification email:', emailError)
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Se este e-mail não estiver cadastrado, você receberá um link de confirmação.',
    })
  } catch (error) {
    console.error('[POST /api/register]', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
