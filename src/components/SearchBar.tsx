'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SearchResult {
  id: string
  content: string
  slug: string | null
  publishedAt: string | null
  answerCount: number
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`)
      const data = await res.json()
      setResults(data.results)
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      setOpen(false)
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
    }
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar perguntas..."
          className="w-full pl-9 pr-3 py-1.5 text-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#818CF8] transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#818CF8] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--text-secondary)]">Nenhum resultado encontrado.</p>
          ) : (
            <>
              {results.map((r) => (
                <Link
                  key={r.id}
                  href={`/pergunta/${r.slug}`}
                  onClick={() => { setOpen(false); setQuery('') }}
                  className="block px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border)] last:border-b-0"
                >
                  <p className="text-sm text-[var(--text-primary)] leading-snug line-clamp-2">{r.content}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {r.answerCount} {r.answerCount === 1 ? 'resposta' : 'respostas'}
                  </p>
                </Link>
              ))}
              <Link
                href={`/busca?q=${encodeURIComponent(query.trim())}`}
                onClick={() => { setOpen(false); setQuery('') }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-[#818CF8] hover:bg-[var(--bg-hover)] transition-colors font-medium"
              >
                Ver todos os resultados →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
