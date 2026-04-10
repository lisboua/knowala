import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Badge from '@/components/Badge'
import AvatarPicker from '@/components/AvatarPicker'
import { getCurrentStreak } from '@/lib/score'
import type { Metadata } from 'next'

interface ProfilePageProps {
  params: { username: string }
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  return {
    title: `u/${params.username}`,
    description: `Perfil de ${params.username} no Knowala`,
  }
}

async function getProfileData(username: string) {
  const user = await db.user.findUnique({
    where: { username },
    include: {
      badges: {
        include: { badge: true },
        orderBy: { awardedAt: 'asc' },
      },
      answers: {
        where: { deletedByMod: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          question: { select: { id: true, content: true } },
          votes: true,
          _count: { select: { comments: true } },
        },
      },
      _count: {
        select: {
          answers: true,
          comments: true,
        },
      },
    },
  })

  return user
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getAnswerScore(votes: Array<{ value: number }>): number {
  return votes.reduce((sum, v) => sum + v.value, 0)
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const [session, user] = await Promise.all([auth(), getProfileData(params.username)])

  if (!user) {
    notFound()
  }

  const streak = await getCurrentStreak(user.id)
  const isOwnProfile = session?.user?.id === user.id

  const joinDate = formatDate(user.createdAt)
  const totalUpvotes = await db.vote.count({
    where: {
      value: 1,
      OR: [
        { targetType: 'ANSWER', answer: { userId: user.id } },
        { targetType: 'COMMENT', comment: { userId: user.id } },
      ],
    },
  })

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-4">
        <div className="flex items-start gap-4">
          {isOwnProfile ? (
            <AvatarPicker currentImage={user.image} userName={user.name} />
          ) : user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={72}
              height={72}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-[#818CF8] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {user.name[0].toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{user.name}</h1>
            <p className="text-sm text-[var(--text-secondary)]">u/{user.username}</p>

            {user.role === 'ADMIN' && (
              <span className="inline-block mt-1 text-xs bg-[#818CF8]/20 text-[#818CF8] px-2 py-0.5 rounded">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div
            className="bg-[var(--bg-primary)] rounded p-3 text-center cursor-help"
            title="O Eco é sua reputação no Knowala. Como é calculado: +2 por upvote em resposta · +1 por upvote em comentário · -1 por downvote"
          >
            <p className="text-lg font-bold text-[#818CF8]">⚡ {user.ecoScore}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Eco Score</p>
          </div>
          <div className="bg-[var(--bg-primary)] rounded p-3 text-center">
            <p className="text-lg font-bold text-[var(--text-primary)]">{user._count.answers}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Respostas</p>
          </div>
          <div className="bg-[var(--bg-primary)] rounded p-3 text-center">
            <p className="text-lg font-bold text-[var(--text-primary)]">{totalUpvotes}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Upvotes</p>
          </div>
          <div className="bg-[var(--bg-primary)] rounded p-3 text-center">
            <p className="text-lg font-bold text-[var(--text-primary)]">🔥 {streak}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Sequência</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Membro desde {joinDate}
        </div>
      </div>

      {/* Badges */}
      {user.badges.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 mb-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Conquistas ({user.badges.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {user.badges.map((userBadge) => (
              <Badge
                key={userBadge.id}
                icon={userBadge.badge.icon}
                name={userBadge.badge.name}
                description={userBadge.badge.description}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent answers */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Respostas Recentes
        </h2>

        {user.answers.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-4 text-center">
            {isOwnProfile
              ? 'Você ainda não respondeu nenhuma pergunta. Comece hoje!'
              : 'Nenhuma resposta ainda.'}
          </p>
        ) : (
          <div className="space-y-3">
            {user.answers.map((answer) => {
              const score = getAnswerScore(answer.votes)
              return (
                <div
                  key={answer.id}
                  className="border border-[var(--border)] rounded p-3 hover:border-[var(--text-secondary)] transition-colors"
                >
                  <p className="text-xs text-[var(--text-secondary)] mb-1 line-clamp-1">
                    {answer.question.content}
                  </p>
                  <p className="text-sm text-[var(--text-primary)] line-clamp-3 leading-relaxed">
                    {answer.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                    <span className={score >= 0 ? 'text-[#818CF8]' : 'text-[#7193ff]'}>
                      {score > 0 ? '+' : ''}{score} pontos
                    </span>
                    <span>{answer._count.comments} comentários</span>
                    <span className="ml-auto">
                      {new Date(answer.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {user._count.answers > 10 && (
          <p className="text-xs text-[var(--text-secondary)] text-center mt-3">
            Mostrando as 10 respostas mais recentes de {user._count.answers} no total.
          </p>
        )}
      </div>

      {/* Back link */}
      <div className="mt-4">
        <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          ← Voltar para a pergunta do dia
        </Link>
      </div>
    </div>
  )
}
