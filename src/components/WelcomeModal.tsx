'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface WelcomeModalProps {
  show: boolean
}

const STEPS = [
  {
    emoji: '🌿',
    title: 'Bem-vindo ao Knowala!',
    subtitle: 'Que bom ter você por aqui.',
    content: (
      <p className="text-[var(--text-secondary)] text-center leading-relaxed">
        Knowala não é sobre responder certo.<br />
        É sobre <span className="text-[var(--text-primary)] font-medium">pensar junto</span>.
      </p>
    ),
  },
  {
    emoji: '💬',
    title: 'O que combina com a roda',
    subtitle: null,
    content: (
      <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
        <li className="flex gap-2.5 items-start">
          <span className="text-[var(--accent)] mt-0.5 shrink-0">●</span>
          <span>Responder do seu jeito: com uma frase, uma história, uma opinião ou uma reflexão</span>
        </li>
        <li className="flex gap-2.5 items-start">
          <span className="text-[var(--accent)] mt-0.5 shrink-0">●</span>
          <span>Comentar para expandir a conversa, não para vencer</span>
        </li>
        <li className="flex gap-2.5 items-start">
          <span className="text-[var(--accent)] mt-0.5 shrink-0">●</span>
          <span>Discordar com curiosidade</span>
        </li>
        <li className="flex gap-2.5 items-start">
          <span className="text-[var(--accent)] mt-0.5 shrink-0">●</span>
          <span>Trazer nuance, experiência e ponto de vista</span>
        </li>
        <li className="flex gap-2.5 items-start">
          <span className="text-[var(--accent)] mt-0.5 shrink-0">●</span>
          <span>Ler os outros com abertura, não com pressa de julgar</span>
        </li>
      </ul>
    ),
  },
  {
    emoji: '🚫',
    title: 'O que quebra a vibe',
    subtitle: null,
    content: (
      <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
        <li className="flex gap-2.5 items-start">
          <span className="text-red-400/70 mt-0.5 shrink-0">✕</span>
          <span>Responder como se houvesse uma resposta certa</span>
        </li>
        <li className="flex gap-2.5 items-start">
          <span className="text-red-400/70 mt-0.5 shrink-0">✕</span>
          <span>Transformar tudo em debate agressivo</span>
        </li>
        <li className="flex gap-2.5 items-start">
          <span className="text-red-400/70 mt-0.5 shrink-0">✕</span>
          <span>Ironia para diminuir o outro</span>
        </li>
        <li className="flex gap-2.5 items-start">
          <span className="text-red-400/70 mt-0.5 shrink-0">✕</span>
          <span>Pressionar alguém a se expor mais do que quis</span>
        </li>
        <li className="flex gap-2.5 items-start">
          <span className="text-red-400/70 mt-0.5 shrink-0">✕</span>
          <span>Comentar só para corrigir, ridicularizar ou encerrar a conversa</span>
        </li>
      </ul>
    ),
  },
  {
    emoji: '✨',
    title: 'Em resumo',
    subtitle: null,
    content: (
      <div className="text-center space-y-4">
        <div className="space-y-2 text-[var(--text-secondary)]">
          <p>
            Menos <span className="line-through opacity-50">performance</span>.{' '}
            Mais <span className="text-[var(--text-primary)] font-medium">honestidade</span>.
          </p>
          <p>
            Menos <span className="line-through opacity-50">small talk</span>.{' '}
            Mais <span className="text-[var(--text-primary)] font-medium">conversa de verdade</span>.
          </p>
        </div>
        <div className="pt-2">
          <p className="text-sm text-[var(--accent)] font-medium">
            Aqui, vale mais abrir uma conversa boa<br />
            do que tentar ter a melhor resposta.
          </p>
        </div>
      </div>
    ),
  },
]

export default function WelcomeModal({ show }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(show)
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const isLastStep = step === STEPS.length - 1

  const dismiss = useCallback(async () => {
    setIsOpen(false)
    document.body.style.overflow = ''
    try {
      await fetch('/api/profile/welcome', { method: 'POST' })
      router.refresh()
    } catch {
      // silently fail — not critical
    }
  }, [router])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, dismiss])

  if (!isOpen) return null

  function goNext() {
    if (animating) return
    if (isLastStep) {
      dismiss()
      return
    }
    setAnimating(true)
    setTimeout(() => {
      setStep((s) => s + 1)
      setAnimating(false)
    }, 150)
  }

  function goBack() {
    if (animating || step === 0) return
    setAnimating(true)
    setTimeout(() => {
      setStep((s) => s - 1)
      setAnimating(false)
    }, 150)
  }

  const current = STEPS[step]

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) dismiss()
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
          aria-label="Fechar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="px-6 pt-8 pb-6">
          {/* Emoji */}
          <div className="flex justify-center mb-4">
            <span
              className={`text-4xl transition-all duration-150 ${
                animating ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
              }`}
            >
              {current.emoji}
            </span>
          </div>

          {/* Title */}
          <div
            className={`text-center mb-6 transition-all duration-150 ${
              animating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
            }`}
          >
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{current.title}</h2>
            {current.subtitle && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">{current.subtitle}</p>
            )}
          </div>

          {/* Step content */}
          <div
            className={`min-h-[160px] flex items-center transition-all duration-150 ${
              animating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
            }`}
          >
            <div className="w-full">{current.content}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          {/* Step indicators */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-6 bg-[var(--accent)]'
                    : i < step
                    ? 'w-1.5 bg-[var(--accent)]/40'
                    : 'w-1.5 bg-[var(--border)]'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={goBack}
                className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--bg-hover)]"
              >
                Voltar
              </button>
            )}
            <button
              onClick={goNext}
              className="px-5 py-2 text-sm font-semibold text-white bg-[var(--accent)] hover:opacity-90 transition-opacity rounded-lg"
            >
              {isLastStep ? 'Bora! 🎉' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
