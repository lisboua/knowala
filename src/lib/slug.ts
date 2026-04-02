import { db } from '@/lib/db'

function getBrasiliaDateStr(date: Date): string {
  // Returns YYYY-MM-DD in Brasília timezone
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9\s]/g, '')     // keep only alphanumeric + spaces
    .trim()
    .replace(/\s+/g, '-')            // spaces → dashes
    .slice(0, 60)
    .replace(/-+$/, '')              // no trailing dashes
}

export async function generateUniqueSlug(content: string, date: Date): Promise<string> {
  const dateStr = getBrasiliaDateStr(date)
  const textPart = slugifyText(content)
  const base = `${dateStr}-${textPart}`

  // Ensure uniqueness
  let slug = base
  let suffix = 2

  while (true) {
    const existing = await db.question.findUnique({ where: { slug } })
    if (!existing) break
    slug = `${base}-${suffix}`
    suffix++
  }

  return slug
}
