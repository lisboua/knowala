import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const generateSchema = z.object({
  quantity: z.number().int().min(1).max(50),
  assignToEmail: z.string().email().optional(),
})

// GET: List all invite codes + waitlist
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 403 })
    }

    const [invites, waitlist, userInviteStats] = await Promise.all([
      db.inviteCode.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { username: true, name: true } },
          usedBy: { select: { username: true, name: true } },
        },
      }),
      db.waitlist.findMany({ orderBy: { createdAt: 'desc' } }),
      db.user.findMany({
        select: { id: true, username: true, name: true, invitesRemaining: true, _count: { select: { inviteCodesCreated: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      success: true,
      invites,
      waitlist,
      userInviteStats,
    })
  } catch (error) {
    console.error('[GET /api/admin/invites]', error)
    return NextResponse.json({ success: false, error: 'Erro interno.' }, { status: 500 })
  }
}

// POST: Generate invite codes (admin creates them assigned to themselves, or gives invites to a user)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = generateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { quantity, assignToEmail } = parsed.data

    if (assignToEmail) {
      // Give invites to a specific user (increment their invitesRemaining)
      const user = await db.user.findUnique({ where: { email: assignToEmail } })
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Usuário não encontrado.' },
          { status: 404 }
        )
      }

      await db.user.update({
        where: { id: user.id },
        data: { invitesRemaining: { increment: quantity } },
      })

      return NextResponse.json({
        success: true,
        message: `${quantity} convites adicionados para ${user.username}.`,
      })
    }

    // Generate invite codes directly (admin creates pre-generated codes)
    const codes: string[] = []
    for (let i = 0; i < quantity; i++) {
      const code = randomBytes(6).toString('hex')
      await db.inviteCode.create({
        data: {
          code,
          createdById: session.user.id,
        },
      })
      codes.push(code)
    }

    return NextResponse.json({
      success: true,
      codes,
      message: `${quantity} códigos de convite gerados.`,
    })
  } catch (error) {
    console.error('[POST /api/admin/invites]', error)
    return NextResponse.json({ success: false, error: 'Erro interno.' }, { status: 500 })
  }
}
