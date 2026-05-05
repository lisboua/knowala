'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from './ui/Button'

interface AnswerFormProps {
  questionId: string
  isAuthenticated: boolean
  hasAlreadyAnswered: boolean
  isHome?: boolean
}

export default function AnswerForm({ questionId, isAuthenticated, hasAlreadyAnswered, isHome = false }: AnswerFormProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAuthOptions, setShowAuthOptions] = useState(false)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const placeholder = isHome
    ? 'Compartilhe sua perspectiva sobre a pergunta de hoje...'
    : 'Compartilhe sua perspectiva sobre essa pergunta...'

  if (hasAlreadyAnswered) {
    return (
      <div className="border border-[var(--border)] rounded-lg px-4 py-3 mb-4">
        <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Você já respondeu a pergunta de hoje.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="border border-[var(--border)] rounded-lg px-4 py-3 mb-4">
        <p className="text-sm text-green-400 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Resposta enviada com sucesso!
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent('/#responder')
    return (
      <div className="border border-[var(--border)] rounded-lg mb-4 overflow-hidden">
        {!showAuthOptions ? (
          <button
            onClick={() => setShowAuthOptions(true)}
            className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            {placeholder}
          </button>
        ) : (
          <div className="px-4 py-3 bg-[var(--bg-card)]">
            <p className="text-sm text-[var(--text-secondary)] mb-3">Entre para participar da discussão de hoje.</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/login?callbackUrl=${returnTo}`)}
                className="text-sm px-4 py-1.5 border border-[var(--border)] text-[var(--text-primary)] rounded hover:border-[var(--text-secondary)] transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => router.push(`/register?callbackUrl=${returnTo}`)}
                className="text-sm px-4 py-1.5 bg-[#818CF8] hover:bg-[#6366F1] text-white rounded font-semibold transition-colors"
              >
                Cadastrar
              </button>
              <button
                onClick={() => setShowAuthOptions(false)}
                className="ml-auto text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim(), questionId }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Erro ao enviar resposta.')
          return
        }

        setContent('')
        setIsExpanded(false)
        setSuccess(true)
        router.refresh()
      } catch {
        setError('Erro ao enviar resposta. Tente novamente.')
      }
    })
  }

  function handleCollapsedClick() {
    setIsExpanded(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function handleCancel() {
    setContent('')
    setError(null)
    setIsExpanded(false)
  }

  return (
    <div className="border border-[var(--border)] rounded-lg mb-4 overflow-hidden">
      {!isExpanded ? (
        <button
          onClick={handleCollapsedClick}
          className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          {placeholder}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)]">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
            placeholder={placeholder}
            rows={5}
            maxLength={5000}
            className="w-full bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none resize-none border-b border-[var(--border)] overflow-hidden"
          />
          {error && (
            <p className="text-xs text-red-500 px-4 pt-2">{error}</p>
          )}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-[var(--text-secondary)]">{content.length}/5000</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1"
              >
                Cancelar
              </button>
              <Button
                type="submit"
                size="sm"
                loading={isPending}
                disabled={content.length < 10 || content.length > 5000}
              >
                Enviar
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
