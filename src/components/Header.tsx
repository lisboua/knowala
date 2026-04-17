'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import Image from 'next/image'
import { useTheme, type Theme } from '@/contexts/ThemeContext'
import NotificationBell from '@/components/NotificationBell'

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: 'dark',
    label: 'Escuro',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 0010 9.79z" />
      </svg>
    ),
  },
  {
    value: 'light',
    label: 'Claro',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 7a5 5 0 100 10A5 5 0 0012 7zm0-5a1 1 0 011 1v2a1 1 0 01-2 0V3a1 1 0 011-1zm0 16a1 1 0 011 1v2a1 1 0 01-2 0v-2a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0l1.41 1.41a1 1 0 01-1.41 1.42L4.22 5.64a1 1 0 010-1.42zm13.14 13.14a1 1 0 011.42 0l1.41 1.41a1 1 0 01-1.41 1.42l-1.42-1.42a1 1 0 010-1.41zM3 12a1 1 0 011-1h2a1 1 0 010 2H4a1 1 0 01-1-1zm15 0a1 1 0 011-1h2a1 1 0 010 2h-2a1 1 0 01-1-1zM4.22 19.78a1 1 0 010-1.42l1.41-1.41a1 1 0 011.42 1.41l-1.42 1.42a1 1 0 01-1.41 0zm13.14-13.14a1 1 0 010-1.42l1.41-1.41a1 1 0 111.42 1.41l-1.42 1.42a1 1 0 01-1.41 0z" />
      </svg>
    ),
  },
  {
    value: 'auto',
    label: 'Auto',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 2v16a8 8 0 010-16z" />
      </svg>
    ),
  },
]

export default function Header() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--bg-primary)]/90 border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 text-[#818CF8] font-extrabold text-xl tracking-tight hover:opacity-80 transition-opacity">
          <Image
            src="/koala-logo-final.png"
            alt="Knowala"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          Knowala
        </Link>


        {/* Nav */}
        <nav className="flex items-center gap-2">
          {status === 'loading' ? (
            <div className="w-20 h-8 bg-[var(--bg-card)] rounded animate-pulse" />
          ) : session ? (
            <div className="flex items-center gap-1">
              <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-[var(--text-primary)] hover:text-white transition-colors p-1 rounded"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'Avatar'}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#818CF8] flex items-center justify-center text-white font-bold text-sm">
                    {(session.user.name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium">
                  {session.user.username || session.user.name}
                </span>
                <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden">
                    <div className="px-3 py-2 border-b border-[var(--border)]">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{session.user.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">u/{session.user.username}</p>
                      <p
                        className="text-xs text-[#818CF8] font-semibold mt-0.5 cursor-help"
                        title="O Eco é sua reputação no Knowala. Como é calculado: +2 por upvote em resposta · +1 por upvote em comentário · -1 por downvote"
                      >
                        ⚡ {session.user.ecoScore} Eco
                      </p>
                    </div>
                    <Link
                      href={`/profile/${session.user.username}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Meu Perfil
                    </Link>
                    <div className="border-t border-[var(--border)]">
                      <Link
                        href="/arquivo"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Arquivo
                      </Link>
                      <Link
                        href="/sugestoes"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Sugestões
                      </Link>
                    </div>
                    <Link
                      href="/convites"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Convites
                    </Link>
                    <Link
                      href="/notificacoes"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Notificações
                    </Link>
                    {session.user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Painel Admin
                      </Link>
                    )}
                    <div className="border-t border-[var(--border)] px-3 py-2">
                      <p className="text-xs text-[var(--text-secondary)] mb-1.5">Modo de visualização</p>
                      <div className="flex gap-1">
                        {themeOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setTheme(opt.value)}
                            title={opt.label}
                            className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded text-xs transition-colors ${
                              theme === opt.value
                                ? 'bg-[#818CF8] text-white'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {opt.icon}
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-[var(--text-primary)] hover:text-white px-3 py-1.5 rounded border border-[var(--border)] hover:border-[var(--text-secondary)] transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="text-sm bg-[#818CF8] hover:bg-[#6366F1] text-white px-3 py-1.5 rounded font-semibold transition-colors"
              >
                Lista de espera
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
