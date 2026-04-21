/**
 * Backfill badges for all existing users based on their current data.
 * Does NOT send notifications (retroactive awards).
 *
 * Usage:
 *   npx tsx scripts/backfill-badges.ts
 *   npx tsx scripts/backfill-badges.ts --dry-run
 */

import { PrismaClient } from '@prisma/client'
import { getCurrentStreak } from '../src/lib/score'

const db = new PrismaClient()
const DRY_RUN = process.argv.includes('--dry-run')

// ── Badge condition helpers ────────────────────────────────────────────────────

async function getBadgesToAward(userId: string, createdAt: Date): Promise<string[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      answers: { where: { deletedByMod: false }, select: { id: true } },
      comments: { where: { deletedByMod: false }, select: { id: true } },
      badges: { include: { badge: true } },
    },
  })

  if (!user) return []

  const existing = new Set(user.badges.map((ub) => ub.badge.key))
  const toAward: string[] = []
  const check = (key: string) => !existing.has(key)

  // Onboarding
  if (check('welcome') && user.answers.length >= 1) toAward.push('welcome')

  // Respostas postadas
  if (check('regular') && user.answers.length >= 10) toAward.push('regular')
  if (check('contributor') && user.answers.length >= 50) toAward.push('contributor')
  if (check('expert') && user.answers.length >= 200) toAward.push('expert')

  // Comentários
  if (check('participant') && user.comments.length >= 10) toAward.push('participant')
  if (check('debater') && user.comments.length >= 50) toAward.push('debater')
  if (check('orator') && user.comments.length >= 200) toAward.push('orator')

  // Upvotes recebidos
  if (check('appreciated') || check('recognized') || check('influential')) {
    const total = await db.vote.count({
      where: {
        value: 1,
        OR: [
          { targetType: 'ANSWER', answer: { userId } },
          { targetType: 'COMMENT', comment: { userId } },
        ],
      },
    })
    if (check('appreciated') && total >= 10) toAward.push('appreciated')
    if (check('recognized') && total >= 50) toAward.push('recognized')
    if (check('influential') && total >= 100) toAward.push('influential')
  }

  // Qualidade por resposta
  const needsPerAnswer =
    (check('well_received') || check('highlight') || check('spark')) && user.answers.length > 0

  if (needsPerAnswer) {
    let answersWithHighUpvotes = 0
    let sparkAwarded = existing.has('spark')

    for (const answer of user.answers) {
      const [upvoteCount, commentCount] = await Promise.all([
        db.vote.count({ where: { answerId: answer.id, targetType: 'ANSWER', value: 1 } }),
        db.comment.count({ where: { answerId: answer.id, deletedByMod: false } }),
      ])

      if (upvoteCount >= 10) answersWithHighUpvotes++

      if (!sparkAwarded && commentCount >= 5) {
        toAward.push('spark')
        sparkAwarded = true
      }
    }

    if (check('well_received') && answersWithHighUpvotes >= 1) toAward.push('well_received')
    if (check('highlight') && answersWithHighUpvotes >= 3) toAward.push('highlight')
  }

  // Upvotes dados
  if (check('attentive') || check('supporter') || check('generous')) {
    const given = await db.vote.count({ where: { userId, value: 1 } })
    if (check('attentive') && given >= 10) toAward.push('attentive')
    if (check('supporter') && given >= 50) toAward.push('supporter')
    if (check('generous') && given >= 200) toAward.push('generous')
  }

  // Convites
  if (check('connector') || check('ambassador')) {
    const invites = await db.inviteCode.count({
      where: { createdById: userId, usedById: { not: null } },
    })
    if (check('connector') && invites >= 1) toAward.push('connector')
    if (check('ambassador') && invites >= 5) toAward.push('ambassador')
  }

  // Pioneiro
  if (check('pioneer')) {
    const rank = await db.user.count({ where: { createdAt: { lte: createdAt } } })
    if (rank <= 500) toAward.push('pioneer')
  }

  // Veterano
  if (check('veteran')) {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    if (createdAt <= oneYearAgo) toAward.push('veteran')
  }

  // Streak (baseado no streak atual)
  if (check('perfect_week') || check('consistent_month')) {
    const streak = await getCurrentStreak(userId)
    if (check('perfect_week') && streak >= 7) toAward.push('perfect_week')
    if (check('consistent_month') && streak >= 30) toAward.push('consistent_month')
  }

  return toAward
}

async function awardBadge(userId: string, badgeKey: string): Promise<void> {
  const badge = await db.badge.findUnique({ where: { key: badgeKey } })
  if (!badge) {
    console.warn(`    ⚠️  Badge "${badgeKey}" não encontrada no banco — rode o seed primeiro`)
    return
  }
  try {
    await db.userBadge.create({ data: { userId, badgeId: badge.id } })
  } catch {
    // unique constraint — já tinha
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏅  Backfill de badges ${DRY_RUN ? '(DRY RUN — nada será salvo)' : ''}`)
  console.log('─'.repeat(60))

  const users = await db.user.findMany({
    select: { id: true, username: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`👥  ${users.length} usuários encontrados\n`)

  const summary: Record<string, number> = {}
  let usersWithNewBadges = 0
  let totalAwarded = 0

  for (const user of users) {
    const badges = await getBadgesToAward(user.id, user.createdAt)

    if (badges.length === 0) continue

    usersWithNewBadges++
    totalAwarded += badges.length

    for (const key of badges) {
      summary[key] = (summary[key] ?? 0) + 1
    }

    console.log(`  @${user.username}: +${badges.join(', ')}`)

    if (!DRY_RUN) {
      for (const key of badges) {
        await awardBadge(user.id, key)
      }
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`\n📊  Resumo:`)
  console.log(`  Usuários com novas badges: ${usersWithNewBadges}`)
  console.log(`  Total de badges concedidas: ${totalAwarded}`)

  if (Object.keys(summary).length > 0) {
    console.log('\n  Por badge:')
    const sorted = Object.entries(summary).sort((a, b) => b[1] - a[1])
    for (const [key, count] of sorted) {
      console.log(`    ${key.padEnd(20)} ${count}`)
    }
  }

  if (DRY_RUN) {
    console.log('\n  ℹ️  Rode sem --dry-run para aplicar as mudanças.')
  } else {
    console.log('\n✅  Backfill concluído!')
  }
}

main()
  .catch((e) => {
    console.error('\n❌  Erro:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
