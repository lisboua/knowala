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

import { getCurrentStreak, updateUserEcoScore } from '@/lib/score'

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
  it('returns 0 when user has no votes', async () => {
    mockCount.mockResolvedValue(0)
    const score = await updateUserEcoScore('user-1')
    expect(score).toBe(0)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data:  { ecoScore: 0 },
    }))
  })

  it('calculates score: +2 per answer upvote, +1 per comment upvote, -1 per downvote', async () => {
    // answer upvotes=10, answer downvotes=2, comment upvotes=5, comment downvotes=1
    mockCount
      .mockResolvedValueOnce(10)  // answerUpvotes
      .mockResolvedValueOnce(2)   // answerDownvotes
      .mockResolvedValueOnce(5)   // commentUpvotes
      .mockResolvedValueOnce(1)   // commentDownvotes

    const score = await updateUserEcoScore('user-1')
    // 10*2 + 5*1 - 2*1 - 1*1 = 20 + 5 - 2 - 1 = 22
    expect(score).toBe(22)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { ecoScore: 22 },
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
    mockCount.mockResolvedValue(5)
    // mockCount called 4 times: answerUp=5, answerDown=5, commentUp=5, commentDown=5
    // 5*2 + 5*1 - 5*1 - 5*1 = 10 + 5 - 5 - 5 = 5
    const score = await updateUserEcoScore('user-1')
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})
