/**
 * Tests for slug.ts — mocks DB to test generateUniqueSlug with real code.
 */

// ─── Mock DB ──────────────────────────────────────────────────────────────────
const mockFindUnique = jest.fn()

jest.mock('@/lib/db', () => ({
  db: {
    question: { findUnique: (...args: any[]) => mockFindUnique(...args) },
  },
}))

import { generateUniqueSlug } from '@/lib/slug'

beforeEach(() => jest.clearAllMocks())

// ─── generateUniqueSlug (real function, DB mocked) ────────────────────────────

describe('generateUniqueSlug', () => {
  const date = new Date('2025-03-20T15:00:00Z') // 12:00 Brasília → date = 2025-03-20

  it('generates a slug with date prefix', async () => {
    mockFindUnique.mockResolvedValue(null) // no collision
    const slug = await generateUniqueSlug('Qual é o seu hobby favorito?', date)
    expect(slug).toMatch(/^2025-03-20-/)
  })

  it('lowercases and removes accents', async () => {
    mockFindUnique.mockResolvedValue(null)
    const slug = await generateUniqueSlug('Você já foi à praia?', date)
    expect(slug).toBe('2025-03-20-voce-ja-foi-a-praia')
  })

  it('replaces spaces with dashes', async () => {
    mockFindUnique.mockResolvedValue(null)
    const slug = await generateUniqueSlug('Hello World', date)
    expect(slug).toBe('2025-03-20-hello-world')
  })

  it('removes special characters', async () => {
    mockFindUnique.mockResolvedValue(null)
    const slug = await generateUniqueSlug('O que é isso?!', date)
    expect(slug).toBe('2025-03-20-o-que-e-isso')
  })

  it('adds numeric suffix on collision', async () => {
    // First call returns existing (collision), second returns null (free)
    mockFindUnique
      .mockResolvedValueOnce({ id: 'existing' }) // base slug taken
      .mockResolvedValueOnce(null)               // base-2 is free
    const slug = await generateUniqueSlug('Hello World', date)
    expect(slug).toBe('2025-03-20-hello-world-2')
    expect(mockFindUnique).toHaveBeenCalledTimes(2)
  })

  it('increments suffix until a free slug is found', async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: '1' }) // base taken
      .mockResolvedValueOnce({ id: '2' }) // base-2 taken
      .mockResolvedValueOnce({ id: '3' }) // base-3 taken
      .mockResolvedValueOnce(null)        // base-4 free
    const slug = await generateUniqueSlug('Hello World', date)
    expect(slug).toBe('2025-03-20-hello-world-4')
  })

  it('slug text part is max 60 chars', async () => {
    mockFindUnique.mockResolvedValue(null)
    const longText = 'palavra '.repeat(20)
    const slug = await generateUniqueSlug(longText, date)
    const textPart = slug.replace(/^\d{4}-\d{2}-\d{2}-/, '')
    expect(textPart.length).toBeLessThanOrEqual(60)
  })

  it('does not end with a dash', async () => {
    mockFindUnique.mockResolvedValue(null)
    const slug = await generateUniqueSlug('Test text', date)
    expect(slug.endsWith('-')).toBe(false)
  })

  it('uses Brasília date (midnight UTC = previous day in Brasília)', async () => {
    mockFindUnique.mockResolvedValue(null)
    const midnight = new Date('2025-03-20T00:00:00Z') // 21:00 Mar 19 in Brasília
    const slug = await generateUniqueSlug('Test', midnight)
    expect(slug).toMatch(/^2025-03-19-/)
  })
})
