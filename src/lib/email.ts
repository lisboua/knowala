import nodemailer from 'nodemailer'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'

// ─── Daily Digest ────────────────────────────────────────────────────────────

interface DigestAnswer {
  rank: number
  content: string
  username: string
  upvotes: number
  isUserAnswer: boolean
}

interface DigestData {
  todayQuestion: { content: string; slug: string }
  yesterdayQuestion: { content: string; slug: string } | null
  topAnswers: DigestAnswer[]
  userAnsweredYesterday: boolean
  unsubscribeUrl: string
  baseUrl: string
}

function buildDigestHtml(data: DigestData): string {
  const { todayQuestion, yesterdayQuestion, topAnswers, userAnsweredYesterday, unsubscribeUrl, baseUrl } = data

  const rankEmoji = ['🥇', '🥈', '🥉']

  const answerCards = topAnswers.map((a) => {
    const highlight = a.isUserAnswer
      ? 'border-color:#818CF8;background-color:#1e1e3a;'
      : 'border-color:#2d2d2f;background-color:#1e1e1f;'
    const badge = a.isUserAnswer
      ? `<span style="display:inline-block;background-color:#818CF8;color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;margin-bottom:10px;letter-spacing:0.03em;">Sua resposta</span>`
      : ''
    const truncated = a.content.length > 220 ? a.content.slice(0, 220) + '…' : a.content
    return `
      <div style="border-radius:12px;border:1px solid;${highlight}padding:16px 18px;margin-bottom:12px;">
        ${badge}
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <span style="font-size:20px;line-height:1;flex-shrink:0;">${rankEmoji[a.rank - 1] ?? '·'}</span>
          <div style="flex:1;min-width:0;">
            <p style="margin:0 0 8px;color:#d7dadc;font-size:14px;line-height:1.6;">${truncated}</p>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="color:#6b7280;font-size:12px;">u/${a.username}</span>
              <span style="color:#818CF8;font-size:12px;font-weight:600;">▲ ${a.upvotes}</span>
            </div>
          </div>
        </div>
      </div>`
  }).join('')

  const yesterdaySection = yesterdayQuestion ? `
    <div style="margin-bottom:40px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">Ontem</p>
      <h2 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#d7dadc;line-height:1.4;">${yesterdayQuestion.content}</h2>
      ${topAnswers.length > 0 ? answerCards : '<p style="color:#6b7280;font-size:14px;">Ainda sem respostas.</p>'}
      ${!userAnsweredYesterday ? `
        <div style="margin-top:20px;border-radius:12px;border:1px solid #2d2d2f;background-color:#1e1e1f;padding:16px 20px;display:flex;align-items:center;gap:14px;">
          <span style="font-size:22px;flex-shrink:0;">💬</span>
          <div>
            <p style="margin:0 0 4px;color:#d7dadc;font-size:14px;font-weight:500;">Você ainda não respondeu — mas ainda dá tempo!</p>
            <p style="margin:0 0 12px;color:#6b7280;font-size:13px;">Veja o que as pessoas disseram e adicione sua perspectiva.</p>
            <a href="${baseUrl}/pergunta/${yesterdayQuestion.slug}" style="display:inline-block;background-color:#818CF8;color:#fff;font-size:13px;font-weight:600;padding:8px 18px;border-radius:8px;text-decoration:none;">Responder agora →</a>
          </div>
        </div>` : ''}
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Knowala — Pergunta do dia</title>
</head>
<body style="margin:0;padding:0;background-color:#111113;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111113;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo + header -->
          <tr>
            <td style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:800;color:#818CF8;letter-spacing:-0.5px;">Knowala</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Today hero -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;border:1px solid #2a2a4a;padding:28px 28px 24px;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818CF8;">Pergunta de hoje</p>
              <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#f0f0f2;line-height:1.35;">${todayQuestion.content}</h1>
              <a href="${baseUrl}/pergunta/${todayQuestion.slug}"
                 style="display:inline-block;background-color:#818CF8;color:#ffffff;font-size:14px;font-weight:600;padding:11px 22px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
                Responder agora →
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="height:32px;"></td></tr>

          <!-- Yesterday recap -->
          ${yesterdaySection}

          <!-- Divider -->
          <tr><td style="height:8px;border-top:1px solid #1e1e1f;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#3d3d3f;line-height:1.6;">
                Você está recebendo este e-mail porque se inscreveu no Knowala.<br />
                <a href="${unsubscribeUrl}" style="color:#3d3d3f;text-decoration:underline;">Cancelar inscrição</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendDailyDigest(): Promise<{ sent: number; skipped: number }> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://knowala.com.br'

  // Fetch today's published question
  const todayQuestion = await db.question.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    select: { id: true, content: true, slug: true, publishedAt: true },
  })

  if (!todayQuestion?.slug) return { sent: 0, skipped: 0 }

  // Yesterday's question (the one before today's)
  const yesterdayQuestion = await db.question.findFirst({
    where: {
      status: 'PUBLISHED',
      id: { not: todayQuestion.id },
    },
    orderBy: { publishedAt: 'desc' },
    select: { id: true, content: true, slug: true },
  })

  // Top 3 answers for yesterday by upvote count, tiebreaker: earliest createdAt
  type AnswerWithVotes = {
    id: string
    content: string
    userId: string
    createdAt: Date
    user: { username: string }
    votes: { value: number }[]
  }
  let topAnswers: AnswerWithVotes[] = []
  if (yesterdayQuestion) {
    const rawAnswers = await db.answer.findMany({
      where: { questionId: yesterdayQuestion.id, deletedByMod: false },
      include: {
        user: { select: { username: true } },
        votes: { where: { targetType: 'ANSWER' }, select: { value: true } },
      },
    })
    topAnswers = rawAnswers
      .sort((a, b) => {
        const scoreA = a.votes.filter((v) => v.value === 1).length
        const scoreB = b.votes.filter((v) => v.value === 1).length
        if (scoreB !== scoreA) return scoreB - scoreA
        return a.createdAt.getTime() - b.createdAt.getTime()
      })
      .slice(0, 3)
  }

  // Fetch eligible users
  const users = await db.user.findMany({
    where: { emailVerified: true, emailDigest: true },
    select: { id: true, email: true, name: true, emailDigestToken: true },
  })

  const transporter = createTransporter()
  let sent = 0
  let skipped = 0

  for (const user of users) {
    // Ensure unsubscribe token exists
    let token = user.emailDigestToken
    if (!token) {
      token = randomBytes(32).toString('hex')
      await db.user.update({ where: { id: user.id }, data: { emailDigestToken: token } })
    }

    // Check if user answered yesterday
    const userAnsweredYesterday = yesterdayQuestion
      ? (await db.answer.count({
          where: { userId: user.id, questionId: yesterdayQuestion.id },
        })) > 0
      : true

    const digestAnswers: DigestAnswer[] = topAnswers.map((a, i) => ({
      rank: i + 1,
      content: a.content,
      username: a.user.username,
      upvotes: a.votes.filter((v) => v.value === 1).length,
      isUserAnswer: a.userId === user.id,
    }))

    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${token}`

    const html = buildDigestHtml({
      todayQuestion: { content: todayQuestion.content, slug: todayQuestion.slug! },
      yesterdayQuestion: yesterdayQuestion
        ? { content: yesterdayQuestion.content, slug: yesterdayQuestion.slug! }
        : null,
      topAnswers: digestAnswers,
      userAnsweredYesterday,
      unsubscribeUrl,
      baseUrl,
    })

    try {
      await transporter.sendMail({
        from: `"Knowala" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: user.email,
        subject: `💬 ${todayQuestion.content.slice(0, 60)}${todayQuestion.content.length > 60 ? '…' : ''}`,
        html,
        text: `Knowala — Pergunta do dia\n\n${todayQuestion.content}\n\nResponder: ${baseUrl}/pergunta/${todayQuestion.slug}\n\nCancelar inscrição: ${unsubscribeUrl}`,
      })
      sent++
    } catch (err) {
      console.error(`[sendDailyDigest] failed for ${user.email}:`, err)
      skipped++
    }
  }

  return { sent, skipped }
}

export function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    socketTimeout: 15000,
    greetingTimeout: 10000,
  })
}

// ─── Welcome / Onboarding ────────────────────────────────────────────────────

function buildWelcomeHtml(name: string, baseUrl: string, todayQuestion: { content: string; slug: string } | null): string {
  const firstName = name.split(' ')[0]

  const todaySection = todayQuestion
    ? `
      <!-- CTA final — pergunta de hoje -->
      <tr>
        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;border:1px solid #2a2a4a;padding:28px 28px 24px;margin-bottom:28px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818CF8;">Agora é com você</p>
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f0f0f2;line-height:1.35;">${todayQuestion.content}</h2>
          <p style="margin:0 0 20px;font-size:13px;color:#9ca3af;line-height:1.5;">Essa é a pergunta de hoje. Você tem uma perspectiva sobre isso — compartilhe.</p>
          <a href="${baseUrl}/pergunta/${todayQuestion.slug}"
             style="display:inline-block;background-color:#818CF8;color:#ffffff;font-size:14px;font-weight:600;padding:11px 22px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
            Responder agora →
          </a>
        </td>
      </tr>`
    : `
      <!-- CTA final — ir para a plataforma -->
      <tr>
        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px;border:1px solid #2a2a4a;padding:28px 28px 24px;margin-bottom:28px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818CF8;">Agora é com você</p>
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f0f0f2;line-height:1.35;">Entre na conversa</h2>
          <p style="margin:0 0 20px;font-size:13px;color:#9ca3af;line-height:1.5;">Uma nova pergunta chega todo dia. Responda, vote, comente — faça parte.</p>
          <a href="${baseUrl}"
             style="display:inline-block;background-color:#818CF8;color:#ffffff;font-size:14px;font-weight:600;padding:11px 22px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
            Ir para o Knowala →
          </a>
        </td>
      </tr>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Bem-vindo ao Knowala, ${firstName}!</title>
</head>
<body style="margin:0;padding:0;background-color:#111113;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111113;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-size:22px;font-weight:800;color:#818CF8;letter-spacing:-0.5px;">Knowala</span>
            </td>
          </tr>

          <!-- Hero boas-vindas -->
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#f0f0f2;line-height:1.25;">Bem-vindo, ${firstName}. 👋</h1>
              <p style="margin:0;font-size:15px;color:#9ca3af;line-height:1.6;">Sua conta está confirmada. Aqui vai um guia rápido de tudo que você pode fazer no Knowala.</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="height:1px;background-color:#1e1e1f;margin-bottom:32px;"></td></tr>
          <tr><td style="height:24px;"></td></tr>

          <!-- BLOCO 1: Arquivo -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">📂 Arquivo</p>
              <h2 style="margin:0 0 8px;font-size:17px;font-weight:600;color:#d7dadc;line-height:1.4;">Explore todas as perguntas anteriores</h2>
              <p style="margin:0 0 16px;font-size:13px;color:#6b7280;line-height:1.6;">Cada pergunta publicada fica guardada com todas as respostas da comunidade. É onde você vê o que foi debatido, descobre perspectivas novas e ainda pode responder mesmo depois do dia.</p>
              <img src="${baseUrl}/email/onboarding/arquivo.png" alt="Arquivo de Perguntas" width="512" style="width:100%;max-width:512px;border-radius:10px;border:1px solid #2d2d2f;display:block;" />
              <a href="${baseUrl}/arquivo" style="display:inline-block;margin-top:14px;color:#818CF8;font-size:13px;font-weight:600;text-decoration:none;">Ver arquivo →</a>
            </td>
          </tr>

          <!-- BLOCO 2: Votos -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">▲▼ Votos</p>
              <h2 style="margin:0 0 8px;font-size:17px;font-weight:600;color:#d7dadc;line-height:1.4;">Vote para moldar o que vale ler</h2>
              <p style="margin:0 0 16px;font-size:13px;color:#6b7280;line-height:1.6;">Cada resposta tem botões de upvote e downvote. As mais votadas sobem — você decide o que a comunidade vê primeiro. É uma forma simples de sinalizar o que acha relevante, sem precisar escrever nada.</p>
              <img src="${baseUrl}/email/onboarding/votos.png" alt="Sistema de votos" width="512" style="width:100%;max-width:512px;border-radius:10px;border:1px solid #2d2d2f;display:block;" />
            </td>
          </tr>

          <!-- BLOCO 3: Comentários -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">🗨️ Comentários</p>
              <h2 style="margin:0 0 8px;font-size:17px;font-weight:600;color:#d7dadc;line-height:1.4;">Comente e debata nas respostas</h2>
              <p style="margin:0 0 16px;font-size:13px;color:#6b7280;line-height:1.6;">Além da sua resposta, você pode comentar em qualquer resposta de outro usuário. Discorde, acrescente, faça uma pergunta. O debate acontece nos comentários.</p>
              <img src="${baseUrl}/email/onboarding/comentarios.png" alt="Comentários em respostas" width="512" style="width:100%;max-width:512px;border-radius:10px;border:1px solid #2d2d2f;display:block;" />
            </td>
          </tr>

          <!-- BLOCO 4: Sugestões -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">💡 Sugestões</p>
              <h2 style="margin:0 0 8px;font-size:17px;font-weight:600;color:#d7dadc;line-height:1.4;">Sugira a próxima pergunta</h2>
              <p style="margin:0 0 16px;font-size:13px;color:#6b7280;line-height:1.6;">Tem uma pergunta que gostaria de ver debatida? Envie uma sugestão. A comunidade vota nas melhores e elas entram na fila para virar a pergunta do dia.</p>
              <img src="${baseUrl}/email/onboarding/sugestoes.png" alt="Sugestões de perguntas" width="512" style="width:100%;max-width:512px;border-radius:10px;border:1px solid #2d2d2f;display:block;" />
              <a href="${baseUrl}/sugestoes" style="display:inline-block;margin-top:14px;color:#818CF8;font-size:13px;font-weight:600;text-decoration:none;">Sugerir uma pergunta →</a>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="height:8px;border-top:1px solid #1e1e1f;"></td></tr>
          <tr><td style="height:24px;"></td></tr>

          <!-- CTA final -->
          ${todaySection}

          <!-- Divider -->
          <tr><td style="height:8px;border-top:1px solid #1e1e1f;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#3d3d3f;line-height:1.6;">
                Você está recebendo este e-mail porque criou uma conta no Knowala.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendWelcomeEmail(userId: string, email: string, name: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://knowala.com.br'

  const todayQuestion = await db.question.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    select: { content: true, slug: true },
  })

  const html = buildWelcomeHtml(
    name,
    baseUrl,
    todayQuestion?.slug ? { content: todayQuestion.content, slug: todayQuestion.slug } : null
  )

  const firstName = name.split(' ')[0]
  const transporter = createTransporter()

  await transporter.sendMail({
    from: `"Knowala" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: `Bem-vindo ao Knowala, ${firstName}! Veja o que você pode fazer`,
    html,
    text: `Olá, ${firstName}!\n\nSua conta está confirmada. Explore o Knowala:\n\n📂 Arquivo: ${baseUrl}/arquivo\n💡 Sugestões: ${baseUrl}/sugestoes\n\nAcesse: ${baseUrl}`,
  })
}

// ─── Verification Email ───────────────────────────────────────────────────────

export async function sendVerificationEmail(userId: string, email: string, name: string): Promise<void> {
  // Generate secure token
  const token = randomBytes(32).toString('hex')

  // Store token with 24h expiry
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  await db.emailVerificationToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${token}`

  const transporter = createTransporter()

  await transporter.sendMail({
    from: `"Knowala" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: 'Confirme seu e-mail — Knowala',
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme seu e-mail</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #1a1a1b; color: #d7dadc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #272729; border-radius: 8px; padding: 40px; border: 1px solid #343536;">
          <h1 style="color: #818CF8; margin-top: 0;">Knowala</h1>
          <h2 style="color: #d7dadc;">Olá, ${name}!</h2>
          <p style="color: #818384; line-height: 1.6;">
            Obrigado por se cadastrar no Knowala. Para ativar sua conta, confirme seu endereço de e-mail clicando no botão abaixo.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}"
               style="background-color: #818CF8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">
              Confirmar E-mail
            </a>
          </div>
          <p style="color: #818384; font-size: 12px;">
            Este link expira em 24 horas. Se você não criou uma conta no Knowala, ignore este e-mail.
          </p>
          <p style="color: #818384; font-size: 12px;">
            Ou copie e cole este link no seu navegador:<br>
            <span style="color: #818384; word-break: break-all;">${verifyUrl}</span>
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Olá, ${name}!

Obrigado por se cadastrar no Knowala. Para ativar sua conta, confirme seu endereço de e-mail acessando o link abaixo:

${verifyUrl}

Este link expira em 24 horas.

Se você não criou uma conta no Knowala, ignore este e-mail.
    `,
  })
}

export async function sendPasswordResetEmail(userId: string, email: string, name: string): Promise<void> {
  const token = randomBytes(32).toString('hex')

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1)

  await db.passwordResetToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

  const transporter = createTransporter()

  await transporter.sendMail({
    from: `"Knowala" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: 'Redefinir sua senha — Knowala',
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir senha</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #1a1a1b; color: #d7dadc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #272729; border-radius: 8px; padding: 40px; border: 1px solid #343536;">
          <h1 style="color: #818CF8; margin-top: 0;">Knowala</h1>
          <h2 style="color: #d7dadc;">Olá, ${name}!</h2>
          <p style="color: #818384; line-height: 1.6;">
            Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #818CF8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          <p style="color: #818384; font-size: 12px;">
            Este link expira em 1 hora. Se você não solicitou a redefinição de senha, ignore este e-mail.
          </p>
          <p style="color: #818384; font-size: 12px;">
            Ou copie e cole este link no seu navegador:<br>
            <span style="color: #818384; word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Olá, ${name}!

Recebemos uma solicitação para redefinir a senha da sua conta.

Acesse o link abaixo para criar uma nova senha:

${resetUrl}

Este link expira em 1 hora.

Se você não solicitou a redefinição de senha, ignore este e-mail.
    `,
  })
}

export async function verifyPasswordResetToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
  })

  if (!resetToken) {
    return { success: false, error: 'Token inválido.' }
  }

  if (resetToken.used) {
    return { success: false, error: 'Este link já foi utilizado.' }
  }

  if (new Date() > resetToken.expiresAt) {
    return { success: false, error: 'Link expirado. Solicite uma nova redefinição de senha.' }
  }

  return { success: true, userId: resetToken.userId }
}

export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  await db.passwordResetToken.update({
    where: { token },
    data: { used: true },
  })
}

export async function verifyEmailToken(token: string): Promise<{ success: boolean; error?: string; user?: { id: string; email: string; name: string } }> {
  const verificationToken = await db.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!verificationToken) {
    return { success: false, error: 'Token inválido.' }
  }

  if (verificationToken.used) {
    return { success: false, error: 'Token já foi utilizado.' }
  }

  if (new Date() > verificationToken.expiresAt) {
    return { success: false, error: 'Token expirado. Solicite um novo e-mail de verificação.' }
  }

  // Mark token as used and verify user email
  await db.$transaction([
    db.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true },
    }),
    db.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    }),
  ])

  return {
    success: true,
    user: {
      id: verificationToken.user.id,
      email: verificationToken.user.email,
      name: verificationToken.user.name || verificationToken.user.email,
    },
  }
}
