import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Painel Admin',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Admin nav */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[#818CF8] uppercase tracking-wider mr-2">Admin</span>
        <Link
          href="/admin"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 rounded hover:bg-[var(--bg-hover)]"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/questions"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 rounded hover:bg-[var(--bg-hover)]"
        >
          Perguntas
        </Link>
        <Link
          href="/admin/moderation"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 rounded hover:bg-[var(--bg-hover)]"
        >
          Moderação
        </Link>
        <Link
          href="/admin/sugestoes"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 rounded hover:bg-[var(--bg-hover)]"
        >
          Sugestões
        </Link>
        <Link
          href="/admin/convites"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 rounded hover:bg-[var(--bg-hover)]"
        >
          Convites
        </Link>
        <Link
          href="/"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 rounded hover:bg-[var(--bg-hover)] ml-auto"
        >
          ← Ver Site
        </Link>
      </div>
      {children}
    </div>
  )
}
