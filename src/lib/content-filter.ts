import { ContentFilterResult } from '@/types'

// URL patterns
const URL_PATTERNS = [
  // Standard URLs
  /https?:\/\/[^\s]+/gi,
  /www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/gi,

  // Common TLDs
  /\b[a-zA-Z0-9-]+\.(com|net|org|br|io|co|edu|gov|info|biz|app|dev|xyz|online|site|store|shop|tech|me|us|uk|ca|au|de|fr|it|es|pt|ru|cn|jp|kr|in)\b/gi,

  // IP addresses
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
]


// Hate speech patterns in Portuguese (basic wordlist)
const HATE_SPEECH_PATTERNS = [
  // Racial slurs - using regex to catch variations
  /\bn[i1!|]+g[ae3]+r[o0a]?s?\b/gi,
  /\bpr[e3]t[o0]\s+(imundo|fedorento|sujo|burro|macaco)\b/gi,

  // Homophobic slurs
  /\bviad[o0]\b/gi,
  /\bsapatã[o0]\b/gi,
  /\bbich[ao]\s+(nojento|imundo|sujo)\b/gi,

  // Antisemitic
  /\bjud[eu]\s+(safado|imundo|sujo|maldito)\b/gi,

  // Religious hate
  /\b(crente|macumbeiro|judeu|muçulmano)\s+(desgraçado|safado|imundo)\b/gi,

  // Misogynistic content
  /\bput[a4]\s+(velha|feia|gorda|burra)\b/gi,
  /\bmulher\s+(não\s+presta|não\s+sabe|não\s+tem\s+valor)\b/gi,

  // Generic severe insults combined with characteristics
  /\b(gordo|gorda|deficiente|aleijado|retardado)\s+(inútil|inválido|infeliz|desgraçado)\b/gi,
]

export function filterContent(content: string): ContentFilterResult {
  if (!content || content.trim().length === 0) {
    return { valid: false, reason: 'O conteúdo não pode estar vazio.' }
  }

  if (content.length > 10000) {
    return { valid: false, reason: 'O conteúdo é muito longo (máximo 10.000 caracteres).' }
  }

  // Check for URLs
  for (const pattern of URL_PATTERNS) {
    pattern.lastIndex = 0 // Reset regex state
    if (pattern.test(content)) {
      return { valid: false, reason: 'Links e URLs não são permitidos no conteúdo.' }
    }
  }

  // Check for hate speech
  for (const pattern of HATE_SPEECH_PATTERNS) {
    pattern.lastIndex = 0
    if (pattern.test(content)) {
      return { valid: false, reason: 'Conteúdo com discurso de ódio não é permitido.' }
    }
  }

  return { valid: true }
}

export function sanitizeText(text: string): string {
  // Remove null bytes and control characters (except newlines and tabs)
  return text
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
}
