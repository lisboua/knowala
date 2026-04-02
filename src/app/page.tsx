import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getCurrentQuestion } from '@/lib/questions'
import { db } from '@/lib/db'
import QuestionView from '@/components/QuestionView'
import HomeHero from '@/components/HomeHero'
import WelcomeModal from '@/components/WelcomeModal'

export default async function HomePage() {
  const [session, question] = await Promise.all([auth(), getCurrentQuestion()])

  const currentUserId = session?.user?.id
  const isAuthenticated = !!session?.user

  let showWelcome = false
  if (currentUserId) {
    const user = await db.user.findUnique({
      where: { id: currentUserId },
      select: { hasSeenWelcome: true },
    })
    showWelcome = user ? !user.hasSeenWelcome : false
  }

  if (!question) {
    return (
      <>
        {showWelcome && <WelcomeModal show />}
        <HomeHero />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-2xl font-bold text-[var(--text-primary)] mb-2">Nenhuma pergunta hoje</p>
          <p className="text-[var(--text-secondary)] max-w-sm">
            Ainda não há uma pergunta publicada para hoje. Volte em breve!
          </p>
          <Link
            href="/arquivo"
            className="mt-6 text-sm text-[#818CF8] hover:underline"
          >
            Ver perguntas anteriores →
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      {showWelcome && <WelcomeModal show />}
      <HomeHero />
      <div id="pergunta-do-dia">
        <QuestionView
          question={question}
          currentUserId={currentUserId}
          isAuthenticated={isAuthenticated}
          isHome
          limitAnswers={3}
        />
      </div>
      <div className="max-w-2xl mx-auto mt-4 pb-8">
        <Link
          href="/arquivo"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          ← Ver perguntas anteriores
        </Link>
      </div>
    </>
  )
}
