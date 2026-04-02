import { db } from '@/lib/db'

const EXPIRY_DAYS = 30
const UPVOTE_MILESTONES = [10, 25, 50, 100]

function expiresAt() {
  const d = new Date()
  d.setDate(d.getDate() + EXPIRY_DAYS)
  return d
}

export async function notifyAnswerUpvote(params: {
  actorId: string
  answerId: string
  answerOwnerId: string
  questionSlug: string
  upvoteCount: number
}) {
  const { actorId, answerId, answerOwnerId, questionSlug, upvoteCount } = params
  if (actorId === answerOwnerId) return

  // One notification per actor+answer — refresh if already exists
  const existing = await db.notification.findFirst({
    where: { userId: answerOwnerId, type: 'ANSWER_UPVOTE', actorId, entityId: answerId },
  })

  if (existing) {
    await db.notification.update({
      where: { id: existing.id },
      data: { read: false, createdAt: new Date(), expiresAt: expiresAt() },
    })
  } else {
    await db.notification.create({
      data: {
        userId: answerOwnerId,
        type: 'ANSWER_UPVOTE',
        actorId,
        entityId: answerId,
        link: `/pergunta/${questionSlug}#answer-${answerId}`,
        expiresAt: expiresAt(),
      },
    })
  }

  // Milestone check — only fire once per milestone per answer
  if (UPVOTE_MILESTONES.includes(upvoteCount)) {
    const milestoneEntityId = `${answerId}:${upvoteCount}`
    const milestoneExists = await db.notification.findFirst({
      where: { userId: answerOwnerId, type: 'MILESTONE', entityId: milestoneEntityId },
    })
    if (!milestoneExists) {
      await db.notification.create({
        data: {
          userId: answerOwnerId,
          type: 'MILESTONE',
          entityId: milestoneEntityId,
          link: `/pergunta/${questionSlug}#answer-${answerId}`,
          meta: { count: upvoteCount },
          expiresAt: expiresAt(),
        },
      })
    }
  }
}

export async function notifyAnswerComment(params: {
  actorId: string
  commentId: string
  answerId: string
  answerOwnerId: string
  questionSlug: string
}) {
  const { actorId, commentId, answerId, answerOwnerId, questionSlug } = params
  if (actorId === answerOwnerId) return

  await db.notification.create({
    data: {
      userId: answerOwnerId,
      type: 'ANSWER_COMMENT',
      actorId,
      entityId: commentId,
      link: `/pergunta/${questionSlug}#comment-${commentId}`,
      expiresAt: expiresAt(),
    },
  })
}

export async function notifyCommentReply(params: {
  actorId: string
  commentId: string
  parentOwnerId: string
  questionSlug: string
}) {
  const { actorId, commentId, parentOwnerId, questionSlug } = params
  if (actorId === parentOwnerId) return

  await db.notification.create({
    data: {
      userId: parentOwnerId,
      type: 'COMMENT_REPLY',
      actorId,
      entityId: commentId,
      link: `/pergunta/${questionSlug}#comment-${commentId}`,
      expiresAt: expiresAt(),
    },
  })
}

export async function notifyBadgeEarned(params: {
  userId: string
  badgeKey: string
  badgeName: string
  username: string
}) {
  const { userId, badgeKey, badgeName, username } = params

  const exists = await db.notification.findFirst({
    where: { userId, type: 'BADGE_EARNED', entityId: badgeKey },
  })
  if (exists) return

  await db.notification.create({
    data: {
      userId,
      type: 'BADGE_EARNED',
      entityId: badgeKey,
      link: `/profile/${username}`,
      meta: { badgeName },
      expiresAt: expiresAt(),
    },
  })
}

export async function notifyDailyQuestion(questionId: string, questionSlug: string) {
  const users = await db.user.findMany({
    where: { emailVerified: true },
    select: { id: true },
  })

  const existing = await db.notification.findMany({
    where: { type: 'DAILY_QUESTION', entityId: questionId },
    select: { userId: true },
  })
  const existingSet = new Set(existing.map((n) => n.userId))

  const toCreate = users
    .filter((u) => !existingSet.has(u.id))
    .map((u) => ({
      userId: u.id,
      type: 'DAILY_QUESTION' as const,
      entityId: questionId,
      link: `/pergunta/${questionSlug}`,
      expiresAt: expiresAt(),
    }))

  if (toCreate.length > 0) {
    await db.notification.createMany({ data: toCreate })
  }
}

export async function deleteExpiredNotifications() {
  await db.notification.deleteMany({ where: { expiresAt: { lt: new Date() } } })
}
