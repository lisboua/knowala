'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'

function UnsubscribeContent() {
  const params = useSearchParams()
  const status = params.get('status')
  const error = params.get('error')
  const token = params.get('token')
  const type = params.get('type') === 'weekly' ? 'weekly' : 'daily'
  const [resubscribed, setResubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const emailLabel = type === 'weekly' ? 'resumo semanal' : 'digest diário'

  async function handleResubscribe() {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type }),
      })
      if (res.ok) setResubscribed(true)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Link inválido</h1>
        <p className="text-sm text-[var(--text-secondary)]">Este link de cancelamento é inválido ou expirou.</p>
        <Link href="/" className="inline-block mt-6 text-sm text-[#818CF8] hover:underline">
          Voltar para o início
        </Link>
      </div>
    )
  }

  if (resubscribed) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-[#818CF8]/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-[#818CF8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Você está de volta!</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Você voltará a receber o {emailLabel} do Knowala.
        </p>
        <Link href="/" className="inline-block mt-6 text-sm text-[#818CF8] hover:underline">
          Ir para o Knowala
        </Link>
      </div>
    )
  }

  if (status === 'success' || status === 'already_unsubscribed') {
    const already = status === 'already_unsubscribed'
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {already ? 'Você já estava desinscrito' : 'Inscrição cancelada'}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {already
            ? `Você não recebia o ${emailLabel} do Knowala.`
            : `Você não receberá mais o ${emailLabel}. Você pode reativar quando quiser nas suas configurações de notificações.`}
        </p>
        {token && (
          <button
            onClick={handleResubscribe}
            disabled={loading}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Aguarde…' : 'Mudou de ideia? Clique para se re-inscrever'}
          </button>
        )}
        <div className="mt-6 flex flex-col gap-2 items-center">
          <Link href="/notificacoes" className="text-sm text-[#818CF8] hover:underline">
            Gerenciar notificações
          </Link>
          <Link href="/" className="text-sm text-[var(--text-secondary)] hover:underline">
            Voltar para o Knowala
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-[var(--text-secondary)]">Processando…</p>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8">
        <div className="mb-6 text-center">
          <span className="text-2xl font-extrabold text-[#818CF8] tracking-tight">Knowala</span>
        </div>
        <Suspense fallback={<p className="text-center text-[var(--text-secondary)] text-sm">Carregando…</p>}>
          <UnsubscribeContent />
        </Suspense>
      </div>
    </div>
  )
}
