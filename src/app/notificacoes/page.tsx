import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import NotificacoesClient from './NotificacoesClient'

export const metadata = { title: 'Notificações — Knowala' }

export default async function NotificacoesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { emailDigest: true, emailWeeklyDigest: true },
  })

  if (!user) redirect('/')

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Notificações</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-10">
        Gerencie quais e-mails você quer receber do Knowala.
      </p>
      <NotificacoesClient
        initialEmailDigest={user.emailDigest}
        initialEmailWeeklyDigest={user.emailWeeklyDigest}
      />
    </div>
  )
}
