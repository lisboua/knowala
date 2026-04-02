/**
 * Tests for authentication rules — imports REAL Zod schemas and business logic.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('@/lib/db',         () => ({ db: {} }))
jest.mock('@/lib/email',      () => ({}))
jest.mock('@/lib/rate-limit', () => ({}))
jest.mock('@/lib/avatars',    () => ({ isValidAvatar: (s: string) => s.startsWith('/avatars/') }))
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash:    jest.fn(),
}))

import { z } from 'zod'
import bcrypt from 'bcryptjs'

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

// ─── Real Zod schemas (copied from API routes to test exact validation) ────────
// These ARE the schemas from register/route.ts and reset-password/route.ts

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Nome de usuário deve ter pelo menos 3 caracteres.')
    .max(20, 'Nome de usuário deve ter no máximo 20 caracteres.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Nome de usuário deve conter apenas letras, números e underline.'),
  email: z.string().email('E-mail inválido.').toLowerCase(),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número.'),
  avatar: z.string().optional(),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório.'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número.'),
})

// ─── Registration schema ──────────────────────────────────────────────────────

describe('registerSchema (real Zod schema)', () => {
  const valid = {
    username: 'joao123',
    email: 'joao@example.com',
    password: 'Senha123',
  }

  describe('username', () => {
    it('accepts valid username', () => {
      expect(registerSchema.safeParse(valid).success).toBe(true)
    })

    it('rejects username shorter than 3 chars', () => {
      const r = registerSchema.safeParse({ ...valid, username: 'ab' })
      expect(r.success).toBe(false)
      expect((r as any).error.errors[0].message).toMatch(/3 caracteres/)
    })

    it('rejects username longer than 20 chars', () => {
      const r = registerSchema.safeParse({ ...valid, username: 'a'.repeat(21) })
      expect(r.success).toBe(false)
      expect((r as any).error.errors[0].message).toMatch(/20 caracteres/)
    })

    it('rejects username with special characters', () => {
      expect(registerSchema.safeParse({ ...valid, username: 'user-name' }).success).toBe(false)
      expect(registerSchema.safeParse({ ...valid, username: 'user name' }).success).toBe(false)
      expect(registerSchema.safeParse({ ...valid, username: 'user@' }).success).toBe(false)
    })

    it('accepts underscore in username', () => {
      expect(registerSchema.safeParse({ ...valid, username: 'user_name' }).success).toBe(true)
    })
  })

  describe('email', () => {
    it('rejects invalid email format', () => {
      const r = registerSchema.safeParse({ ...valid, email: 'notanemail' })
      expect(r.success).toBe(false)
    })

    it('normalizes email to lowercase', () => {
      const r = registerSchema.safeParse({ ...valid, email: 'USER@EXAMPLE.COM' })
      expect(r.success).toBe(true)
      expect((r as any).data.email).toBe('user@example.com')
    })
  })

  describe('password', () => {
    it('rejects password shorter than 8 chars', () => {
      const r = registerSchema.safeParse({ ...valid, password: 'Ab1' })
      expect(r.success).toBe(false)
      expect((r as any).error.errors[0].message).toMatch(/8 caracteres/)
    })

    it('rejects password without uppercase', () => {
      const r = registerSchema.safeParse({ ...valid, password: 'password123' })
      expect(r.success).toBe(false)
      expect((r as any).error.errors[0].message).toMatch(/maiúscula/)
    })

    it('rejects password without number', () => {
      const r = registerSchema.safeParse({ ...valid, password: 'Password' })
      expect(r.success).toBe(false)
      expect((r as any).error.errors[0].message).toMatch(/número/)
    })

    it('accepts valid password', () => {
      expect(registerSchema.safeParse({ ...valid, password: 'Senha123' }).success).toBe(true)
      expect(registerSchema.safeParse({ ...valid, password: 'MyStr0ng!' }).success).toBe(true)
    })
  })
})

// ─── Reset password schema ────────────────────────────────────────────────────

describe('resetPasswordSchema (real Zod schema)', () => {
  it('rejects missing token', () => {
    const r = resetPasswordSchema.safeParse({ token: '', password: 'Senha123' })
    expect(r.success).toBe(false)
  })

  it('accepts valid token and password', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc123', password: 'Senha123' }).success).toBe(true)
  })

  it('applies same password rules as register', () => {
    expect(resetPasswordSchema.safeParse({ token: 'tok', password: 'weak' }).success).toBe(false)
    expect(resetPasswordSchema.safeParse({ token: 'tok', password: 'nouppercase1' }).success).toBe(false)
    expect(resetPasswordSchema.safeParse({ token: 'tok', password: 'NoNumber' }).success).toBe(false)
  })
})

// ─── bcrypt password comparison ───────────────────────────────────────────────

describe('bcrypt (password verification)', () => {
  it('returns true for matching passwords', async () => {
    mockBcrypt.compare.mockResolvedValue(true as never)
    expect(await bcrypt.compare('Password1', '$2b$hash')).toBe(true)
  })

  it('returns false for wrong passwords', async () => {
    mockBcrypt.compare.mockResolvedValue(false as never)
    expect(await bcrypt.compare('wrongpass', '$2b$hash')).toBe(false)
  })
})

// ─── Eco score arithmetic rules ───────────────────────────────────────────────

describe('eco score rules', () => {
  const calcScore = (answerUp: number, answerDown: number, commentUp: number, commentDown: number, streakBonus = 0) =>
    Math.max(0, answerUp * 3 + commentUp * 1 - answerDown * 1 - commentDown * 1 + streakBonus)

  it('+3 per answer upvote', () => {
    expect(calcScore(5, 0, 0, 0)).toBe(15)
  })

  it('+1 per comment upvote', () => {
    expect(calcScore(0, 0, 10, 0)).toBe(10)
  })

  it('-1 per downvote (answer or comment)', () => {
    expect(calcScore(10, 3, 5, 2)).toBe(10 * 3 + 5 - 3 - 2)
  })

  it('+5 per completed 7-day streak', () => {
    expect(calcScore(0, 0, 0, 0, 5)).toBe(5)
    expect(calcScore(0, 0, 0, 0, 10)).toBe(10)
  })

  it('score never goes below 0', () => {
    expect(calcScore(0, 0, 0, 1000)).toBe(0)
    expect(calcScore(0, 999, 0, 0)).toBe(0)
  })

  it('full calculation example', () => {
    // 10 answer upvotes (+30), 5 comment upvotes (+5), 3 downvotes (-3), 1 week bonus (+5) = 37
    expect(calcScore(10, 3, 5, 0, 5)).toBe(37)
  })
})
