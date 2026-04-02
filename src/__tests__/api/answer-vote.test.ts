/**
 * Tests for POST /api/answers/[id]/vote — real route handler, all I/O mocked.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = jest.fn()
jest.mock('@/lib/auth', () => ({ auth: () => mockAuth() }))

const mockAnswerFindUnique = jest.fn()
const mockVoteDeleteMany   = jest.fn()
const mockVoteUpsert       = jest.fn()
const mockVoteCount        = jest.fn()
jest.mock('@/lib/db', () => ({
  db: {
    answer: { findUnique: (...args: any[]) => mockAnswerFindUnique(...args) },
    vote: {
      deleteMany: (...args: any[]) => mockVoteDeleteMany(...args),
      upsert:     (...args: any[]) => mockVoteUpsert(...args),
      count:      (...args: any[]) => mockVoteCount(...args),
    },
  },
}))

const mockRateLimitVote = jest.fn()
jest.mock('@/lib/rate-limit', () => ({
  rateLimitVote: (...args: any[]) => mockRateLimitVote(...args),
}))

jest.mock('@/lib/score',  () => ({ updateUserEcoScore: jest.fn().mockResolvedValue(0) }))
jest.mock('@/lib/badges', () => ({ checkAndAwardBadges: jest.fn().mockResolvedValue(undefined) }))

// ─── Imports ──────────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/answers/[id]/vote/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ANSWER_ID  = 'canswerid0000000000000001'
const VOTER_ID   = 'cvoter000000000000000001'
const AUTHOR_ID  = 'cauthor00000000000000001'

function makeReq(body: object, answerId = ANSWER_ID) {
  return new NextRequest(`http://localhost/api/answers/${answerId}/vote`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const fakeAnswer = { id: ANSWER_ID, userId: AUTHOR_ID, deletedByMod: false }

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: VOTER_ID } })
  mockAnswerFindUnique.mockResolvedValue(fakeAnswer)
  mockRateLimitVote.mockResolvedValue({ success: true })
  mockVoteUpsert.mockResolvedValue({})
  mockVoteDeleteMany.mockResolvedValue({})
  mockVoteCount.mockResolvedValue(0)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/answers/[id]/vote', () => {

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)
      const res = await POST(makeReq({ value: 1 }), { params: { id: ANSWER_ID } })
      expect(res.status).toBe(401)
    })
  })

  describe('input validation', () => {
    it('returns 400 for invalid vote value (e.g., 2)', async () => {
      const res = await POST(makeReq({ value: 2 }), { params: { id: ANSWER_ID } })
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/voto inválido/)
    })

    it('returns 400 for non-numeric vote value', async () => {
      const res = await POST(makeReq({ value: 'up' }), { params: { id: ANSWER_ID } })
      expect(res.status).toBe(400)
    })
  })

  describe('business rules', () => {
    it('returns 404 when answer does not exist', async () => {
      mockAnswerFindUnique.mockResolvedValue(null)
      const res = await POST(makeReq({ value: 1 }), { params: { id: ANSWER_ID } })
      expect(res.status).toBe(404)
    })

    it('returns 404 when answer is deleted by mod', async () => {
      mockAnswerFindUnique.mockResolvedValue({ ...fakeAnswer, deletedByMod: true })
      const res = await POST(makeReq({ value: 1 }), { params: { id: ANSWER_ID } })
      expect(res.status).toBe(404)
    })

    it('returns 400 when user tries to vote on their own answer', async () => {
      // The voter IS the author
      mockAuth.mockResolvedValue({ user: { id: AUTHOR_ID } })
      const res = await POST(makeReq({ value: 1 }), { params: { id: ANSWER_ID } })
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/própria resposta/)
    })

    it('returns 429 when rate limited', async () => {
      mockRateLimitVote.mockResolvedValue({ success: false })
      const res = await POST(makeReq({ value: 1 }), { params: { id: ANSWER_ID } })
      expect(res.status).toBe(429)
    })
  })

  describe('voting actions', () => {
    it('upserts upvote (value=1) and returns updated counts', async () => {
      mockVoteCount.mockResolvedValueOnce(5).mockResolvedValueOnce(1) // 5 up, 1 down
      const res = await POST(makeReq({ value: 1 }), { params: { id: ANSWER_ID } })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.upvotes).toBe(5)
      expect(data.data.downvotes).toBe(1)
      expect(data.data.score).toBe(4)
      expect(data.data.userVote).toBe(1)
      expect(mockVoteUpsert).toHaveBeenCalledTimes(1)
    })

    it('upserts downvote (value=-1)', async () => {
      const res = await POST(makeReq({ value: -1 }), { params: { id: ANSWER_ID } })
      expect(res.status).toBe(200)
      expect(mockVoteUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: expect.objectContaining({ value: -1 }) })
      )
    })

    it('removes vote (value=0) via deleteMany', async () => {
      const res = await POST(makeReq({ value: 0 }), { params: { id: ANSWER_ID } })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.data.userVote).toBeNull()
      expect(mockVoteDeleteMany).toHaveBeenCalledTimes(1)
      expect(mockVoteUpsert).not.toHaveBeenCalled()
    })
  })
})
