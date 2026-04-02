'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Button from './ui/Button'

interface CommentFormProps {
  answerId: string
  parentId?: string | null
  isAuthenticated: boolean
  onSuccess?: (comment: unknown) => void
  onCancel?: () => void
  placeholder?: string
}

export default function CommentForm({
  answerId,
  parentId,
  isAuthenticated,
  onSuccess,
  onCancel,
  placeholder = 'Escreva um comentário...',
}: CommentFormProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        <button
          onClick={() => router.push('/login')}
          className="text-[#818CF8] hover:underline"
        >
          Entre
        </button>{' '}
        para comentar.
      </p>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim(), answerId, parentId }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Erro ao enviar comentário.')
          return
        }

        setContent('')
        if (onSuccess) onSuccess(data.data)
        router.refresh()
      } catch {
        setError('Erro ao enviar comentário. Tente novamente.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={1000}
        className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[#818CF8] focus:border-transparent resize-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-secondary)]">{content.length}/1000</span>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            loading={isPending}
            disabled={!content.trim() || content.length < 2}
          >
            Comentar
          </Button>
        </div>
      </div>
    </form>
  )
}
