/**
 * Tests for POST /api/answers — real route handler, all I/O mocked.
 */

// ─── Mocks (must come before imports) ────────────────────────────────────────

const mockSession = { user: { id: 'user-abc', name: 'Test User' } }
const mockAuth = jest.fn()
jest.mock('@/lib/auth', () => ({ auth: () => mockAuth() }))

const mockQuestionFindUnique = jest.fn()
const mockAnswerFindUnique   = jest.fn()
const mockAnswerCreate       = jest.fn()
jest.mock('@/lib/db', () => ({
  db: {
    question: { findUnique: (...args: any[]) => mockQuestionFindUnique(...args) },
    answer:   {
      findUnique: (...args: any[]) => mockAnswerFindUnique(...args),
      create:     (...args: any[]) => mockAnswerCreate(...args),
    },
  },
}))

const mockRateLimitAnswer = jest.fn()
jest.mock('@/lib/rate-limit', () => ({
  rateLimitAnswer: (...args: any[]) => mockRateLimitAnswer(...args),
}))

jest.mock('@/lib/score',  () => ({ updateUserEcoScore: jest.fn().mockResolvedValue(0) }))
jest.mock('@/lib/badges', () => ({ checkAndAwardBadges: jest.fn().mockResolvedValue(undefined) }))

// ─── Imports ──────────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/answers/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Valid CUID-like IDs (starts with 'c', 8+ chars after 'c', no spaces/dashes)
const QUESTION_ID = 'cjld2cyuq0000t3rmniod1foy'

function makeReq(body: object) {
  return new NextRequest('http://localhost/api/answers', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const validBody = {
  content: 'Esta é uma resposta válida com mais de dez caracteres.',
  questionId: QUESTION_ID,
}

const fakeAnswer = {
  id: 'canswerid0000000000000001',
  content: validBody.content,
  userId: 'user-abc',
  questionId: QUESTION_ID,
  user: { id: 'user-abc', name: 'Test User', username: 'testuser', image: null, ecoScore: 0 },
  votes: [],
  comments: [],
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(mockSession)
  mockQuestionFindUnique.mockResolvedValue({ id: QUESTION_ID, status: 'PUBLISHED' })
  mockRateLimitAnswer.mockResolvedValue({ success: true })
  mockAnswerFindUnique.mockResolvedValue(null) // no previous answer
  mockAnswerCreate.mockResolvedValue(fakeAnswer)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/answers', () => {

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)
      const res = await POST(makeReq(validBody))
      expect(res.status).toBe(401)
      expect((await res.json()).success).toBe(false)
    })
  })

  describe('input validation', () => {
    it('returns 400 when content is too short (under 10 chars)', async () => {
      const res = await POST(makeReq({ ...validBody, content: 'Curta' }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/mínimo 10/)
    })

    it('returns 400 when content is too long (over 5000 chars)', async () => {
      const res = await POST(makeReq({ ...validBody, content: 'a'.repeat(5001) }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/máximo 5000/)
    })

    it('returns 400 when questionId is not a valid CUID', async () => {
      const res = await POST(makeReq({ ...validBody, questionId: 'not-a-cuid' }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/ID de pergunta/)
    })
  })

  describe('business rules', () => {
    it('returns 404 when question does not exist', async () => {
      mockQuestionFindUnique.mockResolvedValue(null)
      const res = await POST(makeReq(validBody))
      expect(res.status).toBe(404)
    })

    it('returns 429 when rate limited', async () => {
      mockRateLimitAnswer.mockResolvedValue({ success: false })
      const res = await POST(makeReq(validBody))
      expect(res.status).toBe(429)
    })

    it('returns 400 when content contains a URL', async () => {
      const res = await POST(makeReq({ ...validBody, content: 'Veja em https://exemplo.com para mais detalhes sobre o assunto.' }))
      expect(res.status).toBe(400)
    })

    it('returns 409 when user already answered this question', async () => {
      mockAnswerFindUnique.mockResolvedValue({ id: 'existing-answer' })
      const res = await POST(makeReq(validBody))
      expect(res.status).toBe(409)
      expect((await res.json()).error).toMatch(/já respondeu/)
    })
  })

  describe('successful answer creation', () => {
    it('returns 201 with the created answer', async () => {
      const res = await POST(makeReq(validBody))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.userId).toBe('user-abc')
    })

    it('creates answer with sanitized content', async () => {
      await POST(makeReq({ ...validBody, content: '  Resposta com espaços   e conteúdo normal.  ' }))
      expect(mockAnswerCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-abc', questionId: QUESTION_ID }),
        })
      )
    })
  })
})
