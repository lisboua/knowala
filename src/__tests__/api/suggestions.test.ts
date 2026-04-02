/**
 * Tests for GET and POST /api/suggestions — real route handlers, all I/O mocked.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = jest.fn()
jest.mock('@/lib/auth', () => ({ auth: () => mockAuth() }))

const mockSuggestionFindMany = jest.fn()
const mockSuggestionCount    = jest.fn()
const mockSuggestionCreate   = jest.fn()
jest.mock('@/lib/db', () => ({
  db: {
    suggestion: {
      findMany: (...args: any[]) => mockSuggestionFindMany(...args),
      count:    (...args: any[]) => mockSuggestionCount(...args),
      create:   (...args: any[]) => mockSuggestionCreate(...args),
    },
  },
}))

const mockRateLimitSuggestion = jest.fn()
jest.mock('@/lib/rate-limit', () => ({
  rateLimitSuggestion: (...args: any[]) => mockRateLimitSuggestion(...args),
}))

// ─── Imports ──────────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/suggestions/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_ID       = 'cuserid00000000000000001'
const SUGGESTION_ID = 'csuggid000000000000000001'

function makeGetReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/suggestions')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

function makePostReq(body: object) {
  return new NextRequest('http://localhost/api/suggestions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const fakeUser       = { id: USER_ID, name: 'Test', username: 'test', image: null }
const fakeSuggestion = {
  id: SUGGESTION_ID,
  content: 'Sugestão de funcionalidade muito boa.',
  postedByAdmin: false,
  createdAt: new Date('2025-03-20T12:00:00Z'),
  user: fakeUser,
  votes: [],
  _count: { votes: 0 },
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(null) // unauthenticated by default
  mockSuggestionFindMany.mockResolvedValue([])
  mockSuggestionCount.mockResolvedValue(0)
  mockSuggestionCreate.mockResolvedValue({ ...fakeSuggestion, user: fakeUser })
  mockRateLimitSuggestion.mockResolvedValue({ success: true })
})

// ─── GET Tests ────────────────────────────────────────────────────────────────

describe('GET /api/suggestions', () => {
  it('returns 200 with empty list when no suggestions', async () => {
    const res = await GET(makeGetReq())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.data.suggestions).toHaveLength(0)
    expect(data.data.total).toBe(0)
  })

  it('calculates upvotes, downvotes and score from votes array', async () => {
    mockSuggestionFindMany.mockResolvedValue([{
      ...fakeSuggestion,
      votes: [
        { userId: 'u1', value: 1 },
        { userId: 'u2', value: 1 },
        { userId: 'u3', value: -1 },
      ],
    }])
    mockSuggestionCount.mockResolvedValue(1)

    const res = await GET(makeGetReq())
    const data = await res.json()
    const s = data.data.suggestions[0]
    expect(s.upvotes).toBe(2)
    expect(s.downvotes).toBe(1)
    expect(s.score).toBe(1)
  })

  it('exposes the authenticated user vote', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID } })
    mockSuggestionFindMany.mockResolvedValue([{
      ...fakeSuggestion,
      votes: [{ userId: USER_ID, value: 1 }],
    }])
    mockSuggestionCount.mockResolvedValue(1)

    const res = await GET(makeGetReq())
    const data = await res.json()
    expect(data.data.suggestions[0].userVote).toBe(1)
  })

  it('returns userVote as null when not authenticated', async () => {
    mockSuggestionFindMany.mockResolvedValue([{ ...fakeSuggestion, votes: [{ userId: 'other', value: 1 }] }])
    mockSuggestionCount.mockResolvedValue(1)

    const res = await GET(makeGetReq())
    const data = await res.json()
    expect(data.data.suggestions[0].userVote).toBeNull()
  })

  it('sorts by votes (score desc) by default', async () => {
    mockSuggestionFindMany.mockResolvedValue([
      { ...fakeSuggestion, id: 'c2', votes: [{ userId: 'u1', value: 1 }] },
      { ...fakeSuggestion, id: 'c1', votes: [] },
    ])
    mockSuggestionCount.mockResolvedValue(2)

    const res = await GET(makeGetReq({ sort: 'votes' }))
    const data = await res.json()
    expect(data.data.suggestions[0].id).toBe('c2') // higher score first
    expect(data.data.suggestions[1].id).toBe('c1')
  })

  it('returns pagination info', async () => {
    mockSuggestionCount.mockResolvedValue(45)
    const res = await GET(makeGetReq({ page: '2' }))
    const data = await res.json()
    expect(data.data.page).toBe(2)
    expect(data.data.totalPages).toBe(3) // ceil(45/20)
  })
})

// ─── POST Tests ───────────────────────────────────────────────────────────────

describe('POST /api/suggestions', () => {

  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID, role: 'USER' } })
  })

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)
      const res = await POST(makePostReq({ content: 'Uma sugestão qualquer.' }))
      expect(res.status).toBe(401)
    })
  })

  describe('input validation', () => {
    it('returns 400 when content is too short (under 10 chars)', async () => {
      const res = await POST(makePostReq({ content: 'Curta' }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/10 caracteres/)
    })

    it('returns 400 when content is too long (over 500 chars)', async () => {
      const res = await POST(makePostReq({ content: 'a'.repeat(501) }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/500 caracteres/)
    })
  })

  describe('business rules', () => {
    it('returns 429 when rate limited', async () => {
      mockRateLimitSuggestion.mockResolvedValue({ success: false })
      const res = await POST(makePostReq({ content: 'Uma sugestão válida aqui.' }))
      expect(res.status).toBe(429)
    })

    it('returns 400 when content contains a URL', async () => {
      const res = await POST(makePostReq({ content: 'Acesse www.spam.com para ver isso e muito mais.' }))
      expect(res.status).toBe(400)
    })

    it('marks suggestion as postedByAdmin when user role is ADMIN', async () => {
      mockAuth.mockResolvedValue({ user: { id: USER_ID, role: 'ADMIN' } })
      await POST(makePostReq({ content: 'Sugestão do administrador do sistema.' }))
      expect(mockSuggestionCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ postedByAdmin: true }) })
      )
    })

    it('does not mark as postedByAdmin for regular users', async () => {
      await POST(makePostReq({ content: 'Sugestão de um usuário normal aqui.' }))
      expect(mockSuggestionCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ postedByAdmin: false }) })
      )
    })
  })

  describe('successful suggestion creation', () => {
    it('returns 201 with the created suggestion', async () => {
      const res = await POST(makePostReq({ content: 'Uma sugestão muito boa para o produto.' }))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.upvotes).toBe(0)
      expect(data.data.downvotes).toBe(0)
      expect(data.data.score).toBe(0)
      expect(data.data.userVote).toBeNull()
    })
  })
})
