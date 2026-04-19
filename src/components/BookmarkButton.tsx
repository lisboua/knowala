'use client'

import { useState } from 'react'

interface BookmarkButtonProps {
  targetType: 'QUESTION' | 'ANSWER' | 'COMMENT'
  targetId: string
  initialIsBookmarked: boolean
  isAuthenticated: boolean
  onRemove?: () => void
}

export default function BookmarkButton({
  targetType,
  targetId,
  initialIsBookmarked,
  isAuthenticated,
  onRemove,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [loading, setLoading] = useState(false)

  if (!isAuthenticated) return null

  async function toggle() {
    if (loading) return
    setLoading(true)
    try {
      const method = isBookmarked ? 'DELETE' : 'POST'
      await fetch('/api/bookmarks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId }),
      })
      if (isBookmarked && onRemove) {
        onRemove()
      } else {
        setIsBookmarked(!isBookmarked)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isBookmarked ? 'Remover dos guardados' : 'Guardar'}
      className={`transition-colors ${
        isBookmarked
          ? 'text-[#818CF8]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      } ${loading ? 'opacity-50' : ''}`}
    >
      {isBookmarked ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 3a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2H5z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2H5z" />
        </svg>
      )}
    </button>
  )
}
