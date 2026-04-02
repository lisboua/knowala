/**
 * Tests for POST /api/comments — real route handler, all I/O mocked.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = jest.fn()
jest.mock('@/lib/auth', () => ({ auth: () => mockAuth() }))

const mockAnswerFindUnique  = jest.fn()
const mockCommentFindUnique = jest.fn()
const mockCommentCreate     = jest.fn()
jest.mock('@/lib/db', () => ({
  db: {
    answer:  { findUnique: (...args: any[]) => mockAnswerFindUnique(...args) },
    comment: {
      findUnique: (...args: any[]) => mockCommentFindUnique(...args),
      create:     (...args: any[]) => mockCommentCreate(...args),
    },
  },
}))

const mockRateLimitComment = jest.fn()
jest.mock('@/lib/rate-limit', () => ({
  rateLimitComment: (...args: any[]) => mockRateLimitComment(...args),
}))

jest.mock('@/lib/badges', () => ({ checkAndAwardBadges: jest.fn().mockResolvedValue(undefined) }))

// ─── Imports ──────────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/comments/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_ID    = 'cuserid00000000000000001'
const ANSWER_ID  = 'canswerid0000000000000001'
const COMMENT_ID = 'ccommentid000000000000001'

function makeReq(body: object) {
  return new NextRequest('http://localhost/api/comments', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const validBody = {
  content: 'Este é um comentário válido.',
  answerId: ANSWER_ID,
}

const fakeComment = {
  id: COMMENT_ID,
  content: validBody.content,
  userId: USER_ID,
  answerId: ANSWER_ID,
  parentId: null,
  user: { id: USER_ID, name: 'Test', username: 'test', image: null, ecoScore: 0 },
  votes: [],
  replies: [],
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: USER_ID } })
  mockRateLimitComment.mockResolvedValue({ success: true })
  mockAnswerFindUnique.mockResolvedValue({ id: ANSWER_ID, deletedByMod: false })
  mockCommentFindUnique.mockResolvedValue(null)
  mockCommentCreate.mockResolvedValue(fakeComment)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/comments', () => {

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)
      const res = await POST(makeReq(validBody))
      expect(res.status).toBe(401)
    })
  })

  describe('input validation', () => {
    it('returns 400 when content is too short (under 2 chars)', async () => {
      const res = await POST(makeReq({ ...validBody, content: 'X' }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/curto/)
    })

    it('returns 400 when content is too long (over 1000 chars)', async () => {
      const res = await POST(makeReq({ ...validBody, content: 'a'.repeat(1001) }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/longo/)
    })

    it('returns 400 when answerId is not a valid CUID', async () => {
      const res = await POST(makeReq({ ...validBody, answerId: 'bad-id' }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/ID de resposta/)
    })
  })

  describe('business rules', () => {
    it('returns 429 when rate limited', async () => {
      mockRateLimitComment.mockResolvedValue({ success: false })
      const res = await POST(makeReq(validBody))
      expect(res.status).toBe(429)
    })

    it('returns 404 when answer does not exist', async () => {
      mockAnswerFindUnique.mockResolvedValue(null)
      const res = await POST(makeReq(validBody))
      expect(res.status).toBe(404)
    })

    it('returns 404 when answer is deleted by mod', async () => {
      mockAnswerFindUnique.mockResolvedValue({ id: ANSWER_ID, deletedByMod: true })
      const res = await POST(makeReq(validBody))
      expect(res.status).toBe(404)
    })

    it('returns 404 when parent comment does not exist', async () => {
      mockCommentFindUnique.mockResolvedValue(null)
      const res = await POST(makeReq({ ...validBody, parentId: COMMENT_ID }))
      expect(res.status).toBe(404)
    })

    it('returns 400 when trying to reply to a reply (max 1 level of nesting)', async () => {
      // Parent comment already has a parentId (it IS a reply)
      mockCommentFindUnique.mockResolvedValue({
        id: COMMENT_ID,
        parentId: 'canotherid00000000000001', // this comment is itself a reply
        deletedByMod: false,
      })
      const res = await POST(makeReq({ ...validBody, parentId: COMMENT_ID }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/Não é possível responder/)
    })

    it('returns 400 when content contains a URL', async () => {
      const res = await POST(makeReq({ ...validBody, content: 'Acesse http://spam.com para detalhes.' }))
      expect(res.status).toBe(400)
    })
  })

  describe('successful comment creation', () => {
    it('returns 201 with created comment', async () => {
      const res = await POST(makeReq(validBody))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.userId).toBe(USER_ID)
    })

    it('creates a reply when parentId is a valid top-level comment', async () => {
      mockCommentFindUnique.mockResolvedValue({
        id: COMMENT_ID,
        parentId: null, // top-level comment → can reply to it
        deletedByMod: false,
      })
      mockCommentCreate.mockResolvedValue({ ...fakeComment, parentId: COMMENT_ID })
      const res = await POST(makeReq({ ...validBody, parentId: COMMENT_ID }))
      expect(res.status).toBe(201)
      expect(mockCommentCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ parentId: COMMENT_ID }) })
      )
    })
  })
})
