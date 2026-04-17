import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { buildWeeklyDigestPayload, buildWeeklyHtmlPublic, createTransporter } from '@/lib/email'

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
    }
  }

  const { to } = await req.json()
  if (!to) return NextResponse.json({ success: false, error: 'Email obrigatório.' }, { status: 400 })

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const unsubscribeUrl = `${baseUrl}/notificacoes`

  const { topQuestions, topAnswer, openQuestion, todayQuestion } = await buildWeeklyDigestPayload(to, baseUrl)

  const topAnswerFormatted = topAnswer
    ? {
        content: topAnswer.content,
        username: topAnswer.user.username,
        upvotes: topAnswer.votes.length,
        questionContent: topAnswer.question.content,
        questionSlug: topAnswer.question.slug!,
        isUserAnswer: false,
      }
    : null

  const html = buildWeeklyHtmlPublic({
    topQuestions,
    topAnswer: topAnswerFormatted,
    userStats: null,
    openQuestion,
    hasInvites: false,
    todayQuestion,
    unsubscribeUrl,
    baseUrl,
  })

  const transporter = createTransporter()
  await transporter.sendMail({
    from: `"Knowala" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `[TESTE] Resumo semanal — Knowala`,
    html,
    text: `Knowala — Resumo semanal (prévia de teste)\n\nAcesse: ${baseUrl}`,
  })

  return NextResponse.json({ success: true })
}
