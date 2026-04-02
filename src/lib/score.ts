import { db } from '@/lib/db'

/**
 * Eco Score Rules:
 * +3 per upvote received on answer
 * +1 per upvote received on comment
 * -1 per downvote received (answer or comment)
 * +5 bonus per 7-day answering streak
 * Minimum: 0
 */

export async function updateUserEcoScore(userId: string): Promise<number> {
  // Calculate score from votes received
  const [answerUpvotes, answerDownvotes, commentUpvotes, commentDownvotes] = await Promise.all([
    db.vote.count({
      where: {
        targetType: 'ANSWER',
        value: 1,
        answer: { userId },
      },
    }),
    db.vote.count({
      where: {
        targetType: 'ANSWER',
        value: -1,
        answer: { userId },
      },
    }),
    db.vote.count({
      where: {
        targetType: 'COMMENT',
        value: 1,
        comment: { userId },
      },
    }),
    db.vote.count({
      where: {
        targetType: 'COMMENT',
        value: -1,
        comment: { userId },
      },
    }),
  ])

  // Calculate streak bonus
  const streakBonus = await calculateStreakBonus(userId)

  let score =
    answerUpvotes * 3 +
    commentUpvotes * 1 -
    answerDownvotes * 1 -
    commentDownvotes * 1 +
    streakBonus

  // Minimum score is 0
  score = Math.max(0, score)

  await db.user.update({
    where: { id: userId },
    data: { ecoScore: score },
  })

  return score
}

export async function calculateStreakBonus(userId: string): Promise<number> {
  // Get all unique dates the user answered questions (UTC-3 Brasília time)
  const answers = await db.answer.findMany({
    where: { userId, deletedByMod: false },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  if (answers.length === 0) return 0

  // Convert to Brasília dates (UTC-3)
  const uniqueDates = new Set<string>()
  for (const answer of answers) {
    const brasiliaDate = new Date(answer.createdAt.getTime() - 3 * 60 * 60 * 1000)
    const dateStr = brasiliaDate.toISOString().split('T')[0]
    uniqueDates.add(dateStr)
  }

  const sortedDates = Array.from(uniqueDates).sort().reverse()

  // Count streaks of 7 consecutive days
  let streakCount = 0
  let currentStreak = 0
  let previousDate: Date | null = null

  for (const dateStr of sortedDates) {
    const currentDate = new Date(dateStr)

    if (previousDate === null) {
      currentStreak = 1
    } else {
      const diffDays = Math.round(
        (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (diffDays === 1) {
        currentStreak++
      } else {
        // Count completed 7-day streaks
        streakCount += Math.floor(currentStreak / 7)
        currentStreak = 1
      }
    }

    previousDate = currentDate
  }

  // Count remaining streak
  streakCount += Math.floor(currentStreak / 7)

  return streakCount * 5
}

export async function getCurrentStreak(userId: string): Promise<number> {
  const answers = await db.answer.findMany({
    where: { userId, deletedByMod: false },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  if (answers.length === 0) return 0

  const uniqueDates = new Set<string>()
  for (const answer of answers) {
    const brasiliaDate = new Date(answer.createdAt.getTime() - 3 * 60 * 60 * 1000)
    const dateStr = brasiliaDate.toISOString().split('T')[0]
    uniqueDates.add(dateStr)
  }

  const sortedDates = Array.from(uniqueDates).sort().reverse()
  const today = new Date()
  const todayBrasilia = new Date(today.getTime() - 3 * 60 * 60 * 1000)
  const todayStr = todayBrasilia.toISOString().split('T')[0]

  // Check if user answered today or yesterday (to keep streak alive)
  if (sortedDates[0] !== todayStr) {
    const yesterday = new Date(todayBrasilia)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (sortedDates[0] !== yesterdayStr) {
      return 0 // Streak broken
    }
  }

  let streak = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i - 1])
    const prev = new Date(sortedDates[i])
    const diffDays = Math.round(
      (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}
