import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

// GET: List my invite codes
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { invitesRemaining: true },
    })

    const invites = await db.inviteCode.findMany({
      where: { createdById: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        usedBy: { select: { username: true, name: true, image: true } },
      },
    })

    return NextResponse.json({
      success: true,
      invitesRemaining: user?.invitesRemaining ?? 0,
      invites: invites.map((inv) => ({
        id: inv.id,
        code: inv.code,
        used: !!inv.usedById,
        usedBy: inv.usedBy
          ? { username: inv.usedBy.username, name: inv.usedBy.name, image: inv.usedBy.image }
          : null,
        usedAt: inv.usedAt,
        createdAt: inv.createdAt,
      })),
    })
  } catch (error) {
    console.error('[GET /api/invites]', error)
    return NextResponse.json({ success: false, error: 'Erro interno.' }, { status: 500 })
  }
}

// POST: Generate a new invite code
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { invitesRemaining: true },
    })

    if (!user || user.invitesRemaining <= 0) {
      return NextResponse.json(
        { success: false, error: 'Você não tem convites disponíveis.' },
        { status: 403 }
      )
    }

    const code = randomBytes(6).toString('hex') // 12 char hex code

    const [invite] = await db.$transaction([
      db.inviteCode.create({
        data: {
          code,
          createdById: session.user.id,
        },
      }),
      db.user.update({
        where: { id: session.user.id },
        data: { invitesRemaining: { decrement: 1 } },
      }),
    ])

    return NextResponse.json({
      success: true,
      invite: { id: invite.id, code: invite.code, createdAt: invite.createdAt },
    })
  } catch (error) {
    console.error('[POST /api/invites]', error)
    return NextResponse.json({ success: false, error: 'Erro interno.' }, { status: 500 })
  }
}
