/**
 * Tests for POST /api/forgot-password and POST /api/reset-password.
 * Real route handlers, all I/O mocked.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUserFindUnique         = jest.fn()
const mockUserUpdate             = jest.fn()
const mockPasswordResetTokenUpdate = jest.fn()
const mockTransaction            = jest.fn()
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
      update:     (...args: any[]) => mockUserUpdate(...args),
    },
    passwordResetToken: {
      update: (...args: any[]) => mockPasswordResetTokenUpdate(...args),
    },
    $transaction: (...args: any[]) => mockTransaction(...args),
  },
}))

const mockRateLimit = jest.fn()
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: any[]) => mockRateLimit(...args),
}))

const mockSendPasswordResetEmail = jest.fn()
const mockVerifyPasswordResetToken = jest.fn()
jest.mock('@/lib/email', () => ({
  sendPasswordResetEmail:    (...args: any[]) => mockSendPasswordResetEmail(...args),
  verifyPasswordResetToken:  (...args: any[]) => mockVerifyPasswordResetToken(...args),
}))

const mockBcryptHash = jest.fn()
jest.mock('bcryptjs', () => ({
  hash:    (...args: any[]) => mockBcryptHash(...args),
  compare: jest.fn(),
}))

// ─── Imports ──────────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { POST as forgotPost }   from '@/app/api/forgot-password/route'
import { POST as resetPost }    from '@/app/api/reset-password/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeForgotReq(body: object) {
  return new NextRequest('http://localhost/api/forgot-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
  })
}

function makeResetReq(body: object) {
  return new NextRequest('http://localhost/api/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
  })
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockRateLimit.mockResolvedValue({ success: true })
  mockUserFindUnique.mockResolvedValue(null)
  mockSendPasswordResetEmail.mockResolvedValue(undefined)
  mockVerifyPasswordResetToken.mockResolvedValue({ success: true, userId: 'user-1' })
  mockBcryptHash.mockResolvedValue('$2b$12$hashed')
  mockTransaction.mockResolvedValue([])
  mockUserUpdate.mockResolvedValue({})
  mockPasswordResetTokenUpdate.mockResolvedValue({})
})

// ─── POST /api/forgot-password ────────────────────────────────────────────────

describe('POST /api/forgot-password', () => {

  describe('rate limiting', () => {
    it('returns 429 when rate limited', async () => {
      mockRateLimit.mockResolvedValue({ success: false })
      const res = await forgotPost(makeForgotReq({ email: 'user@example.com' }))
      expect(res.status).toBe(429)
    })
  })

  describe('input validation', () => {
    it('returns 400 for invalid email format', async () => {
      const res = await forgotPost(makeForgotReq({ email: 'notanemail' }))
      expect(res.status).toBe(400)
    })
  })

  describe('business rules', () => {
    it('returns silent success when email is not registered (prevents enumeration)', async () => {
      mockUserFindUnique.mockResolvedValue(null) // email not found
      const res = await forgotPost(makeForgotReq({ email: 'unknown@example.com' }))
      expect(res.status).toBe(200)
      expect((await res.json()).success).toBe(true)
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('returns 400 with Google message when user has no password (Google-only account)', async () => {
      mockUserFindUnique.mockResolvedValue({ id: 'user-1', email: 'user@example.com', password: null })
      const res = await forgotPost(makeForgotReq({ email: 'user@example.com' }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/Google/)
    })

    it('sends reset email and returns success for valid password account', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1', email: 'user@example.com', name: 'User', password: '$2b$12$hash',
      })
      const res = await forgotPost(makeForgotReq({ email: 'user@example.com' }))
      expect(res.status).toBe(200)
      expect((await res.json()).success).toBe(true)
      expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1)
    })

    it('normalizes email to lowercase before lookup', async () => {
      await forgotPost(makeForgotReq({ email: 'USER@EXAMPLE.COM' }))
      expect(mockUserFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'user@example.com' } })
      )
    })
  })
})

// ─── POST /api/reset-password ─────────────────────────────────────────────────

describe('POST /api/reset-password', () => {

  const validBody = { token: 'valid-reset-token', password: 'NewPassword1' }

  describe('rate limiting', () => {
    it('returns 429 when rate limited', async () => {
      mockRateLimit.mockResolvedValue({ success: false })
      const res = await resetPost(makeResetReq(validBody))
      expect(res.status).toBe(429)
    })
  })

  describe('input validation', () => {
    it('returns 400 when token is empty', async () => {
      const res = await resetPost(makeResetReq({ ...validBody, token: '' }))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/Token/)
    })

    it('returns 400 when password is too short', async () => {
      const res = await resetPost(makeResetReq({ ...validBody, password: 'Ab1' }))
      expect(res.status).toBe(400)
    })

    it('returns 400 when password has no uppercase', async () => {
      const res = await resetPost(makeResetReq({ ...validBody, password: 'nouppercas1' }))
      expect(res.status).toBe(400)
    })

    it('returns 400 when password has no number', async () => {
      const res = await resetPost(makeResetReq({ ...validBody, password: 'NoNumberHere' }))
      expect(res.status).toBe(400)
    })
  })

  describe('business rules', () => {
    it('returns 400 when token is invalid or expired', async () => {
      mockVerifyPasswordResetToken.mockResolvedValue({ success: false, error: 'Token expirado.' })
      const res = await resetPost(makeResetReq(validBody))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/expirado/)
    })
  })

  describe('successful password reset', () => {
    it('returns 200 and updates password + marks token as used', async () => {
      const res = await resetPost(makeResetReq(validBody))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.message).toMatch(/Senha redefinida/)
      expect(mockBcryptHash).toHaveBeenCalledWith('NewPassword1', 12)
      expect(mockTransaction).toHaveBeenCalledTimes(1)
    })
  })
})
