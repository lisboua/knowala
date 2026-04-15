import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

// GET: List my invite codes, auto-generating any remaining credits
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

    const remaining = user?.invitesRemaining ?? 0

    // Auto-generate codes for any unused credits
    if (remaining > 0) {
      const creates = Array.from({ length: remaining }, () =>
        db.inviteCode.create({
          data: { code: randomBytes(6).toString('hex'), createdById: session.user.id },
        })
      )
      await db.$transaction([
        ...creates,
        db.user.update({
          where: { id: session.user.id },
          data: { invitesRemaining: 0 },
        }),
      ])
    }

    const invites = await db.inviteCode.findMany({
      where: { createdById: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        usedBy: { select: { username: true, name: true, image: true } },
      },
    })

    return NextResponse.json({
      success: true,
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
