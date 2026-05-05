'use client'

import Link from 'next/link'

export default function HomeHero() {
  function handleCTA() {
    const el = document.getElementById('pergunta-do-dia')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="max-w-2xl mx-auto pt-8 pb-5">
      <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight tracking-tight mb-3">
        Knowala não é sobre responder certo. É sobre pensar junto.
      </h1>
      <p className="text-[var(--text-secondary)] text-base sm:text-lg mb-5 leading-relaxed max-w-xl">
        Um lugar para gente que pensa diferente, odeia small talk e curte perguntas que abrem a cabeça.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCTA}
          className="inline-flex items-center gap-2 bg-[#818CF8] hover:bg-[#6366F1] text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          Entre na roda de hoje
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <Link
          href="/arquivo"
          className="inline-flex items-center gap-2 border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          Todas as perguntas
        </Link>
      </div>
    </section>
  )
}
