import { db } from '@/lib/db'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const [
    pendingReports,
    totalUsers,
    totalAnswers,
    todayQuestion,
    publishedQuestions,
    scheduledQuestions,
  ] = await Promise.all([
    db.report.count({ where: { status: 'PENDING' } }),
    db.user.count(),
    db.answer.count({ where: { deletedByMod: false } }),
    db.question.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      include: { _count: { select: { answers: true } } },
    }),
    db.question.count({ where: { status: 'PUBLISHED' } }),
    db.question.count({ where: { status: 'SCHEDULED' } }),
  ])

  return (
    <div>
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-6">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{totalUsers}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Usuários</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{totalAnswers}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Respostas</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
          <p className={`text-2xl font-bold ${pendingReports > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
            {pendingReports}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Denúncias Pendentes</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{scheduledQuestions}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Perguntas Agendadas</p>
        </div>
      </div>

      {/* Today's question */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Pergunta Atual</h2>
        {todayQuestion ? (
          <div>
            <p className="text-sm text-[var(--text-primary)] mb-2">{todayQuestion.content}</p>
            <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
              <span className="text-green-400 font-medium">● Publicada</span>
              <span>{todayQuestion._count.answers} respostas</span>
              {todayQuestion.publishedAt && (
                <span>
                  Publicada em{' '}
                  {new Date(todayQuestion.publishedAt).toLocaleDateString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                  })}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Nenhuma pergunta publicada.</p>
            <Link
              href="/admin/questions"
              className="text-sm text-[#818CF8] hover:underline"
            >
              Publicar agora →
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/admin/questions"
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[#818CF8] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#818CF8]/10 rounded flex items-center justify-center text-[#818CF8]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[#818CF8] transition-colors">Gerenciar Perguntas</p>
              <p className="text-xs text-[var(--text-secondary)]">{publishedQuestions} publicadas, {scheduledQuestions} agendadas</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/moderation"
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[#818CF8] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${pendingReports > 0 ? 'bg-red-500/10 text-red-400' : 'bg-[#818CF8]/10 text-[#818CF8]'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H13.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[#818CF8] transition-colors">Moderação</p>
              <p className={`text-xs ${pendingReports > 0 ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                {pendingReports} denúncias pendentes
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/convites"
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[#818CF8] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#818CF8]/10 rounded flex items-center justify-center text-[#818CF8]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[#818CF8] transition-colors">Convites & Waitlist</p>
              <p className="text-xs text-[var(--text-secondary)]">Gerar convites e ver lista de espera</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
