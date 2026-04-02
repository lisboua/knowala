import { PrismaClient } from '@prisma/client'
import { BADGE_DEFINITIONS } from '../src/lib/badges'

const prisma = new PrismaClient()

function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '')
}

function getBrasiliaDateStr(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

async function main() {
  console.log('Seeding badges...')

  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
      },
      create: badge,
    })
    console.log(`  ✓ Badge "${badge.name}"`)
  }

  console.log('\nSeeding sample question...')

  const existingQuestion = await prisma.question.findFirst({
    where: { status: 'PUBLISHED' },
  })

  if (!existingQuestion) {
    const now = new Date()
    const content = 'Se você pudesse mudar uma única coisa na sociedade brasileira hoje, o que seria e por quê?'
    const slug = `${getBrasiliaDateStr(now)}-${slugifyText(content)}`

    await prisma.question.create({
      data: {
        content,
        status: 'PUBLISHED',
        publishedAt: now,
        slug,
      },
    })
    console.log('  ✓ Sample question created')
  } else {
    console.log('  - Question already exists, skipping')
  }

  console.log('\n✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
