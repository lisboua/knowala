import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { getQuestionBySlug } from '@/lib/questions'
import QuestionView from '@/components/QuestionView'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const question = await getQuestionBySlug(slug)

  if (!question) {
    return { title: 'Pergunta não encontrada — Knowala' }
  }

  const description = `${question.answers.length} respostas · Participe da discussão no Knowala`

  return {
    title: `${question.content} — Knowala`,
    description,
    openGraph: {
      title: question.content,
      description,
      type: 'article',
      publishedTime: question.publishedAt?.toISOString(),
    },
  }
}

export default async function QuestionPage({ params }: Props) {
  const { slug } = await params
  const [session, question] = await Promise.all([
    auth(),
    getQuestionBySlug(slug),
  ])

  if (!question) notFound()

  const currentUserId = session?.user?.id
  const isAuthenticated = !!session?.user

  return (
    <QuestionView
      question={question}
      currentUserId={currentUserId}
      isAuthenticated={isAuthenticated}
    />
  )
}
