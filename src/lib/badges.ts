import { db } from '@/lib/db'
import { getCurrentStreak } from '@/lib/score'
import { notifyBadgeEarned } from '@/lib/notifications'
import { BadgeData } from '@/types'

export const BADGE_DEFINITIONS: BadgeData[] = [
  // ── Onboarding ──────────────────────────────────────────────────
  {
    key: 'welcome',
    name: 'Bem-vindo',
    description: 'Postou sua primeira resposta',
    icon: '🌱',
  },

  // ── Streak ──────────────────────────────────────────────────────
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

  // ── Respostas postadas ───────────────────────────────────────────
  {
    key: 'regular',
    name: 'Assíduo',
    description: 'Postou 10 ou mais respostas',
    icon: '📝',
  },
  {
    key: 'contributor',
    name: 'Colaborador',
    description: 'Postou 50 ou mais respostas',
    icon: '📚',
  },
  {
    key: 'expert',
    name: 'Expert',
    description: 'Postou 200 ou mais respostas',
    icon: '🎯',
  },

  // ── Comentários ─────────────────────────────────────────────────
  {
    key: 'participant',
    name: 'Participante',
    description: 'Postou 10 ou mais comentários',
    icon: '💬',
  },
  {
    key: 'debater',
    name: 'Debatedor',
    description: 'Postou 50 ou mais comentários',
    icon: '🗨️',
  },
  {
    key: 'orator',
    name: 'Orador',
    description: 'Postou 200 ou mais comentários',
    icon: '🗣️',
  },

  // ── Qualidade das respostas ──────────────────────────────────────
  {
    key: 'well_received',
    name: 'Bem Recebido',
    description: 'Uma resposta com 10 ou mais upvotes',
    icon: '✨',
  },
  {
    key: 'highlight',
    name: 'Destaque',
    description: '3 respostas diferentes com 10 ou mais upvotes cada',
    icon: '🏅',
  },
  {
    key: 'spark',
    name: 'Faísca',
    description: 'Uma resposta com 5 ou mais comentários',
    icon: '💡',
  },

  // ── Upvotes recebidos ────────────────────────────────────────────
  {
    key: 'appreciated',
    name: 'Apreciado',
    description: 'Recebeu 10 ou mais upvotes no total',
    icon: '💎',
  },
  {
    key: 'recognized',
    name: 'Reconhecido',
    description: 'Recebeu 50 ou mais upvotes no total',
    icon: '🌟',
  },
  {
    key: 'influential',
    name: 'Influente',
    description: 'Recebeu 100 ou mais upvotes no total',
    icon: '⭐',
  },

  // ── Upvotes dados ────────────────────────────────────────────────
  {
    key: 'attentive',
    name: 'Atento',
    description: 'Deu 10 ou mais upvotes para outros usuários',
    icon: '👀',
  },
  {
    key: 'supporter',
    name: 'Apoiador',
    description: 'Deu 50 ou mais upvotes para outros usuários',
    icon: '👍',
  },
  {
    key: 'generous',
    name: 'Generoso',
    description: 'Deu 200 ou mais upvotes para outros usuários',
    icon: '🎖️',
  },

  // ── Convites ─────────────────────────────────────────────────────
  {
    key: 'connector',
    name: 'Conector',
    description: 'Convidou pelo menos 1 usuário que se cadastrou',
    icon: '🤝',
  },
  {
    key: 'ambassador',
    name: 'Embaixador',
    description: 'Convidou 5 ou mais usuários que se cadastraram',
    icon: '🌐',
  },

  // ── Tempo de casa ────────────────────────────────────────────────
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

export async function checkAndAwardBadges(userId: string, notify = true): Promise<void> {
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

  const check = (key: string) => !existingBadgeKeys.has(key)

  // ── Onboarding ──────────────────────────────────────────────────
  if (check('welcome') && user.answers.length >= 1) {
    badgesToAward.push('welcome')
  }

  // ── Respostas postadas ───────────────────────────────────────────
  if (check('regular') && user.answers.length >= 10) badgesToAward.push('regular')
  if (check('contributor') && user.answers.length >= 50) badgesToAward.push('contributor')
  if (check('expert') && user.answers.length >= 200) badgesToAward.push('expert')

  // ── Comentários ─────────────────────────────────────────────────
  if (check('participant') && user.comments.length >= 10) badgesToAward.push('participant')
  if (check('debater') && user.comments.length >= 50) badgesToAward.push('debater')
  if (check('orator') && user.comments.length >= 200) badgesToAward.push('orator')

  // ── Upvotes recebidos ────────────────────────────────────────────
  if (check('appreciated') || check('recognized') || check('influential')) {
    const totalUpvotes = await db.vote.count({
      where: {
        value: 1,
        OR: [
          { targetType: 'ANSWER', answer: { userId } },
          { targetType: 'COMMENT', comment: { userId } },
        ],
      },
    })
    if (check('appreciated') && totalUpvotes >= 10) badgesToAward.push('appreciated')
    if (check('recognized') && totalUpvotes >= 50) badgesToAward.push('recognized')
    if (check('influential') && totalUpvotes >= 100) badgesToAward.push('influential')
  }

  // ── Qualidade por resposta ───────────────────────────────────────
  const needsPerAnswerCheck =
    (check('well_received') || check('highlight') || check('spark')) && user.answers.length > 0

  if (needsPerAnswerCheck) {
    let answersWithHighUpvotes = 0

    for (const answer of user.answers) {
      const [upvoteCount, commentCount] = await Promise.all([
        check('well_received') || check('highlight')
          ? db.vote.count({ where: { answerId: answer.id, targetType: 'ANSWER', value: 1 } })
          : Promise.resolve(0),
        check('spark')
          ? db.comment.count({ where: { answerId: answer.id, deletedByMod: false } })
          : Promise.resolve(0),
      ])

      if (upvoteCount >= 10) answersWithHighUpvotes++

      if (check('spark') && commentCount >= 5) {
        badgesToAward.push('spark')
        existingBadgeKeys.add('spark') // prevent duplicate push
      }
    }

    if (check('well_received') && answersWithHighUpvotes >= 1) {
      badgesToAward.push('well_received')
    }
    if (check('highlight') && answersWithHighUpvotes >= 3) {
      badgesToAward.push('highlight')
    }
  }

  // ── Upvotes dados ────────────────────────────────────────────────
  if (check('attentive') || check('supporter') || check('generous')) {
    const upvotesGiven = await db.vote.count({ where: { userId, value: 1 } })
    if (check('attentive') && upvotesGiven >= 10) badgesToAward.push('attentive')
    if (check('supporter') && upvotesGiven >= 50) badgesToAward.push('supporter')
    if (check('generous') && upvotesGiven >= 200) badgesToAward.push('generous')
  }

  // ── Convites ─────────────────────────────────────────────────────
  if (check('connector') || check('ambassador')) {
    const successfulInvites = await db.inviteCode.count({
      where: { createdById: userId, usedById: { not: null } },
    })
    if (check('connector') && successfulInvites >= 1) badgesToAward.push('connector')
    if (check('ambassador') && successfulInvites >= 5) badgesToAward.push('ambassador')
  }

  // ── Pioneiro ─────────────────────────────────────────────────────
  if (check('pioneer')) {
    const userCount = await db.user.count({ where: { createdAt: { lte: user.createdAt } } })
    if (userCount <= 500) badgesToAward.push('pioneer')
  }

  // ── Veterano ─────────────────────────────────────────────────────
  if (check('veteran')) {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    if (user.createdAt <= oneYearAgo) badgesToAward.push('veteran')
  }

  // ── Streak ──────────────────────────────────────────────────────
  if (check('perfect_week') || check('consistent_month')) {
    const currentStreak = await getCurrentStreak(userId)
    if (check('perfect_week') && currentStreak >= 7) badgesToAward.push('perfect_week')
    if (check('consistent_month') && currentStreak >= 30) badgesToAward.push('consistent_month')
  }

  // ── Conceder badges ──────────────────────────────────────────────
  for (const badgeKey of badgesToAward) {
    await awardBadge(userId, badgeKey)
    if (notify) {
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
}
