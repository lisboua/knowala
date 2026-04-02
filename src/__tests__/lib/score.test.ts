/**
 * Tests for score.ts — imports the REAL functions with DB mocked.
 */

// ─── Mock DB before any imports ───────────────────────────────────────────────
const mockFindMany = jest.fn()
const mockUpdate = jest.fn()
const mockCount = jest.fn()

jest.mock('@/lib/db', () => ({
  db: {
    answer: { findMany: (...args: any[]) => mockFindMany(...args) },
    vote:   { count:    (...args: any[]) => mockCount(...args)    },
    user:   { update:   (...args: any[]) => mockUpdate(...args)   },
  },
}))

import { calculateStreakBonus, getCurrentStreak, updateUserEcoScore } from '@/lib/score'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build UTC Date objects for N consecutive days ending at `endDateStr` (noon UTC) */
function consecutiveDays(endDateStr: string, count: number): { createdAt: Date }[] {
  const result: { createdAt: Date }[] = []
  const base = new Date(endDateStr + 'T15:00:00Z') // 12:00 Brasília (UTC-3)
  for (let i = 0; i < count; i++) {
    const d = new Date(base)
    d.setUTCDate(base.getUTCDate() - i)
    result.push({ createdAt: d })
  }
  return result
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUpdate.mockResolvedValue({})
})

// ─── calculateStreakBonus ─────────────────────────────────────────────────────

describe('calculateStreakBonus', () => {
  it('returns 0 when user has no answers', async () => {
    mockFindMany.mockResolvedValue([])
    expect(await calculateStreakBonus('user-1')).toBe(0)
  })

  it('returns 0 for 6 consecutive days (less than 1 week)', async () => {
    mockFindMany.mockResolvedValue(consecutiveDays('2025-03-20', 6))
    expect(await calculateStreakBonus('user-1')).toBe(0)
  })

  it('returns 5 for exactly 7 consecutive days', async () => {
    mockFindMany.mockResolvedValue(consecutiveDays('2025-03-20', 7))
    expect(await calculateStreakBonus('user-1')).toBe(5)
  })

  it('returns 5 for 13 consecutive days (one complete week)', async () => {
    mockFindMany.mockResolvedValue(consecutiveDays('2025-03-20', 13))
    expect(await calculateStreakBonus('user-1')).toBe(5)
  })

  it('returns 10 for 14 consecutive days (two weeks)', async () => {
    mockFindMany.mockResolvedValue(consecutiveDays('2025-03-20', 14))
    expect(await calculateStreakBonus('user-1')).toBe(10)
  })

  it('returns 15 for 21 consecutive days', async () => {
    mockFindMany.mockResolvedValue(consecutiveDays('2025-03-20', 21))
    expect(await calculateStreakBonus('user-1')).toBe(15)
  })

  it('counts two separate 7-day streaks as 10 bonus', async () => {
    const block1 = consecutiveDays('2025-03-07', 7)   // Mar 01–07
    const block2 = consecutiveDays('2025-03-20', 7)   // Mar 14–20  (gap in between)
    mockFindMany.mockResolvedValue([...block1, ...block2])
    expect(await calculateStreakBonus('user-1')).toBe(10)
  })

  it('deduplicates multiple answers on the same day', async () => {
    // Same Brasília date answered twice → only 1 day counted
    const d1 = new Date('2025-03-20T14:00:00Z')
    const d2 = new Date('2025-03-20T16:00:00Z')
    mockFindMany.mockResolvedValue([{ createdAt: d1 }, { createdAt: d2 }])
    expect(await calculateStreakBonus('user-1')).toBe(0) // only 1 unique day
  })
})

// ─── getCurrentStreak ─────────────────────────────────────────────────────────

describe('getCurrentStreak', () => {
  // Fix "today" by mocking Date — tests run at any real time
  const FAKE_NOW = new Date('2025-03-20T15:00:00Z') // 12:00 Brasília

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(FAKE_NOW)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns 0 for no answers', async () => {
    mockFindMany.mockResolvedValue([])
    expect(await getCurrentStreak('user-1')).toBe(0)
  })

  it('returns 1 if user answered only today', async () => {
    mockFindMany.mockResolvedValue([{ createdAt: new Date('2025-03-20T14:00:00Z') }])
    expect(await getCurrentStreak('user-1')).toBe(1)
  })

  it('returns 1 if last answer was yesterday (streak still alive)', async () => {
    mockFindMany.mockResolvedValue([{ createdAt: new Date('2025-03-19T14:00:00Z') }])
    expect(await getCurrentStreak('user-1')).toBe(1)
  })

  it('returns 0 if last answer was 2+ days ago (streak broken)', async () => {
    mockFindMany.mockResolvedValue([{ createdAt: new Date('2025-03-17T14:00:00Z') }])
    expect(await getCurrentStreak('user-1')).toBe(0)
  })

  it('returns 5 for 5 consecutive days ending today', async () => {
    mockFindMany.mockResolvedValue(consecutiveDays('2025-03-20', 5))
    expect(await getCurrentStreak('user-1')).toBe(5)
  })

  it('stops counting at a gap', async () => {
    // 3 consecutive days ending today + old answers with a gap
    const recent = consecutiveDays('2025-03-20', 3)    // Mar 18–20
    const old    = consecutiveDays('2025-03-10', 3)    // Mar 8–10
    mockFindMany.mockResolvedValue([...recent, ...old])
    expect(await getCurrentStreak('user-1')).toBe(3)
  })
})

// ─── updateUserEcoScore ───────────────────────────────────────────────────────

describe('updateUserEcoScore', () => {
  beforeEach(() => {
    // No answers → no streak bonus
    mockFindMany.mockResolvedValue([])
  })

  it('returns 0 when user has no votes and no streak', async () => {
    mockCount.mockResolvedValue(0)
    const score = await updateUserEcoScore('user-1')
    expect(score).toBe(0)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data:  { ecoScore: 0 },
    }))
  })

  it('calculates score: +3 per answer upvote, +1 per comment upvote, -1 per downvote', async () => {
    // answer upvotes=10, answer downvotes=2, comment upvotes=5, comment downvotes=1
    mockCount
      .mockResolvedValueOnce(10)  // answerUpvotes
      .mockResolvedValueOnce(2)   // answerDownvotes
      .mockResolvedValueOnce(5)   // commentUpvotes
      .mockResolvedValueOnce(1)   // commentDownvotes

    const score = await updateUserEcoScore('user-1')
    // 10*3 + 5*1 - 2*1 - 1*1 = 30 + 5 - 2 - 1 = 32
    expect(score).toBe(32)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { ecoScore: 32 },
    }))
  })

  it('enforces minimum score of 0 (never negative)', async () => {
    // Lots of downvotes, no upvotes
    mockCount
      .mockResolvedValueOnce(0)    // answerUpvotes
      .mockResolvedValueOnce(100)  // answerDownvotes
      .mockResolvedValueOnce(0)    // commentUpvotes
      .mockResolvedValueOnce(50)   // commentDownvotes

    const score = await updateUserEcoScore('user-1')
    expect(score).toBe(0)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { ecoScore: 0 },
    }))
  })

  it('persists the calculated score to the DB', async () => {
    mockCount.mockResolvedValue(5) // 5 answer upvotes = 15 points
    // mockCount called 4 times: answerUp=5, answerDown=5, commentUp=5, commentDown=5
    // 5*3 + 5*1 - 5*1 - 5*1 = 15 + 5 - 5 - 5 = 10
    const score = await updateUserEcoScore('user-1')
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})
