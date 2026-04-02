import { filterContent, sanitizeText } from '@/lib/content-filter'

// ─── filterContent ────────────────────────────────────────────────────────────

describe('filterContent', () => {
  // ── Valid content ─────────────────────────────────────────────────────────
  describe('valid content', () => {
    it('accepts normal text', () => {
      expect(filterContent('Olá, como você está?').valid).toBe(true)
    })

    it('accepts text with numbers', () => {
      expect(filterContent('Tenho 3 gatos e 2 cachorros.').valid).toBe(true)
    })

    it('accepts longer paragraphs', () => {
      const text = 'A educação é fundamental para o desenvolvimento humano. '.repeat(10)
      expect(filterContent(text).valid).toBe(true)
    })
  })

  // ── Empty / too long ──────────────────────────────────────────────────────
  describe('length validation', () => {
    it('rejects empty string', () => {
      const r = filterContent('')
      expect(r.valid).toBe(false)
      expect(r.reason).toMatch(/vazio/)
    })

    it('rejects whitespace-only string', () => {
      expect(filterContent('   ').valid).toBe(false)
    })

    it('rejects content over 10000 chars', () => {
      const r = filterContent('a'.repeat(10001))
      expect(r.valid).toBe(false)
      expect(r.reason).toMatch(/longo/)
    })

    it('accepts content at exactly 10000 chars', () => {
      expect(filterContent('a'.repeat(10000)).valid).toBe(true)
    })
  })

  // ── URL detection ─────────────────────────────────────────────────────────
  describe('URL detection', () => {
    it('blocks http URLs', () => {
      const r = filterContent('Acesse http://exemplo.com para saber mais.')
      expect(r.valid).toBe(false)
      expect(r.reason).toMatch(/URL/)
    })

    it('blocks https URLs', () => {
      expect(filterContent('Veja em https://site.org').valid).toBe(false)
    })

    it('blocks www URLs', () => {
      expect(filterContent('Visite www.google.com amanhã.').valid).toBe(false)
    })

    it('blocks bare domain.com', () => {
      expect(filterContent('entre em google.com para ver').valid).toBe(false)
    })

    it('blocks IP addresses', () => {
      expect(filterContent('Servidor em 192.168.1.1').valid).toBe(false)
    })

    it('blocks "ponto com" obfuscation', () => {
      const r = filterContent('acesse meusite ponto com agora')
      expect(r.valid).toBe(false)
    })

    it('blocks "dot com" obfuscation', () => {
      expect(filterContent('go to example dot com').valid).toBe(false)
    })

    it('blocks obfuscated http', () => {
      expect(filterContent('h t t p s : //link').valid).toBe(false)
    })

    it('blocks "ponto br"', () => {
      expect(filterContent('site ponto br').valid).toBe(false)
    })
  })

  // ── Hate speech ───────────────────────────────────────────────────────────
  describe('hate speech detection', () => {
    it('blocks homophobic slurs', () => {
      expect(filterContent('aquele viado é horrível').valid).toBe(false)
    })

    it('blocks misogynistic patterns', () => {
      expect(filterContent('mulher não presta para nada').valid).toBe(false)
    })

    it('allows neutral use of similar words', () => {
      // "preta" in a neutral context should pass
      expect(filterContent('A cor preta combina bem com branco.').valid).toBe(true)
    })
  })
})

// ─── sanitizeText ────────────────────────────────────────────────────────────

describe('sanitizeText', () => {
  it('removes null bytes', () => {
    expect(sanitizeText('hello\0world')).toBe('helloworld')
  })

  it('removes control characters but keeps newlines', () => {
    expect(sanitizeText('line1\nline2')).toBe('line1\nline2')
    expect(sanitizeText('line1\tline2')).toBe('line1\tline2')
    expect(sanitizeText('bad\x01char')).toBe('badchar')
  })

  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello')
  })

  it('keeps normal unicode', () => {
    expect(sanitizeText('Olá, tudo bem? 😊')).toBe('Olá, tudo bem? 😊')
  })
})
