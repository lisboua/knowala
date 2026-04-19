import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import GuardadosClient from './GuardadosClient'

export const metadata: Metadata = {
  title: 'Guardados — Knowala',
  description: 'Perguntas, respostas e comentários que você salvou no Knowala.',
}

export default async function GuardadosPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Guardados</h1>
        <p className="text-sm text-[var(--text-secondary)]">Itens que você salvou para ler depois.</p>
      </div>
      <GuardadosClient />
    </div>
  )
}
