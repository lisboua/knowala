import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const waitlistSchema = z.object({
  email: z.string().email('E-mail inválido.').toLowerCase(),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    const rateLimitResult = await rateLimit({
      key: `waitlist:${ip}`,
      limit: 5,
      windowSeconds: 3600,
    })
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = waitlistSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    // Upsert to avoid duplicate errors — always return success to prevent enumeration
    await db.waitlist.upsert({
      where: { email },
      update: {},
      create: { email },
    })

    return NextResponse.json({
      success: true,
      message: 'E-mail adicionado à lista de espera.',
    })
  } catch (error) {
    console.error('[POST /api/waitlist]', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
