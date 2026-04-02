/**
 * Tests for POST /api/register — real route handler, all I/O mocked.
 */

// ─── Mocks (must come before imports) ────────────────────────────────────────

const mockUserFindUnique = jest.fn()
const mockUserCreate = jest.fn()

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
      create:     (...args: any[]) => mockUserCreate(...args),
    },
  },
}))

const mockRateLimitRegister = jest.fn()
jest.mock('@/lib/rate-limit', () => ({
  rateLimitRegister: (...args: any[]) => mockRateLimitRegister(...args),
}))

const mockSendVerificationEmail = jest.fn()
jest.mock('@/lib/email', () => ({
  sendVerificationEmail: (...args: any[]) => mockSendVerificationEmail(...args),
}))

jest.mock('@/lib/avatars', () => ({
  isValidAvatar: (s: string) => s.startsWith('/avatars/'),
}))

const mockBcryptHash = jest.fn()
jest.mock('bcryptjs', () => ({
  hash:    (...args: any[]) => mockBcryptHash(...args),
  compare: jest.fn(),
}))

// ─── Imports ──────────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/register/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(body: object) {
  return new NextRequest('http://localhost/api/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
  })
}

const valid = { username: 'joao123', email: 'joao@example.com', password: 'Senha123' }

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockRateLimitRegister.mockResolvedValue({ success: true })
  mockUserFindUnique.mockResolvedValue(null)
  mockUserCreate.mockResolvedValue({ id: 'user-1', name: 'joao123', email: 'joao@example.com' })
  mockBcryptHash.mockResolvedValue('$2b$12$hashed')
  mockSendVerificationEmail.mockResolvedValue(undefined)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/register', () => {

  describe('rate limiting', () => {
    it('returns 429 when rate limited', async () => {
      mockRateLimitRegister.mockResolvedValue({ success: false })
      const res = await POST(makeReq(valid))
      expect(res.status).toBe(429)
      expect((await res.json()).success).toBe(false)
    })
  })

  describe('input validation', () => {
    it('rejects username shorter than 3 chars', async () => {
      const res = await POST(makeReq({ ...valid, username: 'ab' }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/3 caracteres/)
    })

    it('rejects username longer than 20 chars', async () => {
      const res = await POST(makeReq({ ...valid, username: 'a'.repeat(21) }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/20 caracteres/)
    })

    it('rejects username with special characters (dash, space, @)', async () => {
      for (const username of ['user-name', 'user name', 'user@x']) {
        const res = await POST(makeReq({ ...valid, username }))
        expect(res.status).toBe(400)
      }
    })

    it('accepts username with underscore', async () => {
      const res = await POST(makeReq({ ...valid, username: 'user_name' }))
      expect(res.status).toBe(200)
    })

    it('rejects invalid email', async () => {
      const res = await POST(makeReq({ ...valid, email: 'notanemail' }))
      expect(res.status).toBe(400)
    })

    it('rejects password shorter than 8 chars', async () => {
      const res = await POST(makeReq({ ...valid, password: 'Ab1' }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/8 caracteres/)
    })

    it('rejects password without uppercase letter', async () => {
      const res = await POST(makeReq({ ...valid, password: 'senha123' }))
      expect(res.status).toBe(400)
    })

    it('rejects password without number', async () => {
      const res = await POST(makeReq({ ...valid, password: 'SenhaForte' }))
      expect(res.status).toBe(400)
    })

    it('rejects invalid avatar path', async () => {
      const res = await POST(makeReq({ ...valid, avatar: 'hacker.jpg' }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/Avatar/)
    })

    it('accepts valid avatar path', async () => {
      const res = await POST(makeReq({ ...valid, avatar: '/avatars/cat.png' }))
      expect(res.status).toBe(200)
    })
  })

  describe('business rules', () => {
    it('returns 400 when username is already taken', async () => {
      mockUserFindUnique.mockResolvedValueOnce({ id: 'existing-user' }) // username taken
      const res = await POST(makeReq(valid))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/usuário já está em uso/)
    })

    it('returns silent success when email is already registered (prevents enumeration)', async () => {
      mockUserFindUnique
        .mockResolvedValueOnce(null)             // username free
        .mockResolvedValueOnce({ id: 'other' }) // email taken
      const res = await POST(makeReq(valid))
      expect(res.status).toBe(200)
      expect((await res.json()).success).toBe(true)
      expect(mockUserCreate).not.toHaveBeenCalled()
    })

    it('returns 400 on P2002 race condition (username taken between check and insert)', async () => {
      mockUserCreate.mockRejectedValue({ code: 'P2002' })
      const res = await POST(makeReq(valid))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/usuário já está em uso/)
    })
  })

  describe('successful registration', () => {
    it('hashes password with bcrypt cost 12 and creates user', async () => {
      const res = await POST(makeReq(valid))
      expect(res.status).toBe(200)
      expect((await res.json()).success).toBe(true)
      expect(mockBcryptHash).toHaveBeenCalledWith('Senha123', 12)
      expect(mockUserCreate).toHaveBeenCalledTimes(1)
    })

    it('sends verification email after creation', async () => {
      await POST(makeReq(valid))
      expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1)
    })

    it('does not fail if email sending throws', async () => {
      mockSendVerificationEmail.mockRejectedValue(new Error('SMTP error'))
      const res = await POST(makeReq(valid))
      expect(res.status).toBe(200)
      expect((await res.json()).success).toBe(true)
    })

    it('stores username as lowercase', async () => {
      await POST(makeReq({ ...valid, username: 'JoaoUser' }))
      expect(mockUserCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ username: 'joaouser' }) })
      )
    })
  })
})
