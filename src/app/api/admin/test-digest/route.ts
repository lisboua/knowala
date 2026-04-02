import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createTransporter } from '@/lib/email'

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

  const todayQuestion = await db.question.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    select: { id: true, content: true, slug: true },
  })

  const yesterdayQuestion = todayQuestion
    ? await db.question.findFirst({
        where: { status: 'PUBLISHED', id: { not: todayQuestion.id } },
        orderBy: { publishedAt: 'desc' },
        select: { id: true, content: true, slug: true },
      })
    : null

  type AnswerRow = { id: string; content: string; createdAt: Date; user: { username: string }; votes: { value: number }[] }
  let topAnswers: AnswerRow[] = []
  if (yesterdayQuestion) {
    const raw = await db.answer.findMany({
      where: { questionId: yesterdayQuestion.id, deletedByMod: false },
      include: {
        user: { select: { username: true } },
        votes: { where: { targetType: 'ANSWER' }, select: { value: true } },
      },
    })
    topAnswers = raw
      .sort((a, b) => {
        const sa = a.votes.filter((v) => v.value === 1).length
        const sb = b.votes.filter((v) => v.value === 1).length
        return sb !== sa ? sb - sa : a.createdAt.getTime() - b.createdAt.getTime()
      })
      .slice(0, 3)
  }

  const rankEmoji = ['🥇', '🥈', '🥉']
  const answerCards = topAnswers.map((a, i) => {
    const upvotes = a.votes.filter((v) => v.value === 1).length
    const truncated = a.content.length > 220 ? a.content.slice(0, 220) + '…' : a.content
    return `
      <div style="border-radius:12px;border:1px solid #2d2d2f;background-color:#1e1e1f;padding:16px 18px;margin-bottom:12px;">
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <span style="font-size:20px;line-height:1;flex-shrink:0;">${rankEmoji[i]}</span>
          <div style="flex:1;">
            <p style="margin:0 0 8px;color:#d7dadc;font-size:14px;line-height:1.6;">${truncated}</p>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="color:#6b7280;font-size:12px;">u/${a.user.username}</span>
              <span style="color:#818CF8;font-size:12px;font-weight:600;">▲ ${upvotes}</span>
            </div>
          </div>
        </div>
      </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#111113;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111113;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding-bottom:32px;">
          <span style="font-size:22px;font-weight:800;color:#818CF8;letter-spacing:-0.5px;">Knowala</span>
          <span style="margin-left:8px;font-size:11px;color:#818CF8;background:#818CF8/10;border:1px solid #818CF8/30;border-radius:4px;padding:2px 6px;">prévia de teste</span>
        </td></tr>
        ${todayQuestion ? `
        <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;border:1px solid #2a2a4a;padding:28px 28px 24px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818CF8;">Pergunta de hoje</p>
          <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#f0f0f2;line-height:1.35;">${todayQuestion.content}</h1>
          <a href="${baseUrl}/pergunta/${todayQuestion.slug}" style="display:inline-block;background-color:#818CF8;color:#fff;font-size:14px;font-weight:600;padding:11px 22px;border-radius:8px;text-decoration:none;">Responder agora →</a>
        </td></tr>` : '<tr><td style="color:#6b7280;font-size:14px;padding:16px 0;">Nenhuma pergunta publicada ainda.</td></tr>'}
        <tr><td style="height:32px;"></td></tr>
        ${yesterdayQuestion ? `
        <tr><td style="margin-bottom:40px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">Ontem</p>
          <h2 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#d7dadc;line-height:1.4;">${yesterdayQuestion.content}</h2>
          ${topAnswers.length > 0 ? answerCards : '<p style="color:#6b7280;font-size:14px;">Ainda sem respostas.</p>'}
          <div style="margin-top:20px;border-radius:12px;border:1px solid #2d2d2f;background-color:#1e1e1f;padding:16px 20px;display:flex;align-items:center;gap:14px;">
            <span style="font-size:22px;flex-shrink:0;">💬</span>
            <div>
              <p style="margin:0 0 4px;color:#d7dadc;font-size:14px;font-weight:500;">Você ainda não respondeu — mas ainda dá tempo!</p>
              <p style="margin:0 0 12px;color:#6b7280;font-size:13px;">Veja o que as pessoas disseram e adicione sua perspectiva.</p>
              <a href="${baseUrl}/pergunta/${yesterdayQuestion.slug}" style="display:inline-block;background-color:#818CF8;color:#fff;font-size:13px;font-weight:600;padding:8px 18px;border-radius:8px;text-decoration:none;">Responder agora →</a>
            </div>
          </div>
        </td></tr>` : ''}
        <tr><td style="height:8px;border-top:1px solid #1e1e1f;"></td></tr>
        <tr><td style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#3d3d3f;line-height:1.6;">
            Este é um e-mail de teste enviado pelo painel admin do Knowala.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const transporter = createTransporter()
  await transporter.sendMail({
    from: `"Knowala" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `[TESTE] Digest diário — Knowala`,
    html,
  })

  return NextResponse.json({ success: true })
}
