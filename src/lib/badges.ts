import { db } from '@/lib/db'
import { getCurrentStreak } from '@/lib/score'
import { notifyBadgeEarned } from '@/lib/notifications'
import { BadgeData } from '@/types'

export const BADGE_DEFINITIONS: BadgeData[] = [
  {
    key: 'welcome',
    name: 'Bem-vindo',
    description: 'Postou sua primeira resposta',
    icon: '🌱',
  },
  {
    key: 'perfect_week',
    name: 'Semana Perfeita',
    description: 'Respondeu por 7 dias consecutivos',
    icon: '🔥',
  },
  {
    key: 'consistent_month',
    name: 'Mês Consistente',
    description: 'Respondeu por 30 dias consecutivos',
    icon: '💪',
  },
  {
    key: 'debater',
    name: 'Debatedor',
    description: 'Postou mais de 50 comentários',
    icon: '💬',
  },
  {
    key: 'influential',
    name: 'Influente',
    description: 'Recebeu mais de 100 upvotes no total',
    icon: '⭐',
  },
  {
    key: 'pioneer',
    name: 'Pioneiro',
    description: 'Um dos primeiros 500 usuários',
    icon: '🚀',
  },
  {
    key: 'veteran',
    name: 'Veterano',
    description: 'Conta com mais de 1 ano de existência',
    icon: '🏆',
  },
  {
    key: 'well_received',
    name: 'Bem Recebido',
    description: 'Uma resposta com 10 ou mais upvotes',
    icon: '✨',
  },
]

export async function seedBadges(): Promise<void> {
  for (const badge of BADGE_DEFINITIONS) {
    await db.badge.upsert({
      where: { key: badge.key },
      update: { name: badge.name, description: badge.description, icon: badge.icon },
      create: badge,
    })
  }
}

export async function awardBadge(userId: string, badgeKey: string): Promise<void> {
  const badge = await db.badge.findUnique({ where: { key: badgeKey } })
  if (!badge) return

  try {
    await db.userBadge.create({
      data: { userId, badgeId: badge.id },
    })
  } catch {
    // Ignore if already awarded (unique constraint)
  }
}

export async function checkAndAwardBadges(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      answers: {
        where: { deletedByMod: false },
        select: { id: true, createdAt: true },
      },
      comments: {
        where: { deletedByMod: false },
        select: { id: true },
      },
      badges: {
        include: { badge: true },
      },
    },
  })

  if (!user) return

  const existingBadgeKeys = new Set(user.badges.map((ub) => ub.badge.key))
  const badgesToAward: string[] = []

  // welcome: First answer posted
  if (user.answers.length >= 1 && !existingBadgeKeys.has('welcome')) {
    badgesToAward.push('welcome')
  }

  // debater: 50+ comments
  if (user.comments.length >= 50 && !existingBadgeKeys.has('debater')) {
    badgesToAward.push('debater')
  }

  // influential: 100+ upvotes received total
  if (!existingBadgeKeys.has('influential')) {
    const totalUpvotes = await db.vote.count({
      where: {
        value: 1,
        OR: [
          { targetType: 'ANSWER', answer: { userId } },
          { targetType: 'COMMENT', comment: { userId } },
        ],
      },
    })
    if (totalUpvotes >= 100) {
      badgesToAward.push('influential')
    }
  }

  // pioneer: Among first 500 users
  if (!existingBadgeKeys.has('pioneer')) {
    const userCount = await db.user.count({
      where: { createdAt: { lte: user.createdAt } },
    })
    if (userCount <= 500) {
      badgesToAward.push('pioneer')
    }
  }

  // veteran: Account 1 year old
  if (!existingBadgeKeys.has('veteran')) {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    if (user.createdAt <= oneYearAgo) {
      badgesToAward.push('veteran')
    }
  }

  // well_received: Single answer with 10+ upvotes
  if (!existingBadgeKeys.has('well_received') && user.answers.length > 0) {
    for (const answer of user.answers) {
      const upvoteCount = await db.vote.count({
        where: { answerId: answer.id, targetType: 'ANSWER', value: 1 },
      })
      if (upvoteCount >= 10) {
        badgesToAward.push('well_received')
        break
      }
    }
  }

  // perfect_week and consistent_month: streak-based
  const currentStreak = await getCurrentStreak(userId)

  if (currentStreak >= 7 && !existingBadgeKeys.has('perfect_week')) {
    badgesToAward.push('perfect_week')
  }

  if (currentStreak >= 30 && !existingBadgeKeys.has('consistent_month')) {
    badgesToAward.push('consistent_month')
  }

  // Award all earned badges and send notifications
  for (const badgeKey of badgesToAward) {
    await awardBadge(userId, badgeKey)
    const badgeDef = BADGE_DEFINITIONS.find((b) => b.key === badgeKey)
    if (badgeDef) {
      notifyBadgeEarned({
        userId,
        badgeKey,
        badgeName: badgeDef.name,
        username: user.username,
      }).catch(console.error)
    }
  }
}
