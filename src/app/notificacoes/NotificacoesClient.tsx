'use client'

import { useState } from 'react'

interface Props {
  initialEmailDigest: boolean
  initialEmailWeeklyDigest: boolean
}

interface EmailCardProps {
  title: string
  frequency: string
  description: string
  detail: string
  enabled: boolean
  loading: boolean
  onToggle: () => void
}

function EmailCard({ title, frequency, description, detail, enabled, loading, onToggle }: EmailCardProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
            <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
              {frequency}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">{description}</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed border-l-2 border-[var(--border)] pl-3">
            {detail}
          </p>
        </div>
        <button
          onClick={onToggle}
          disabled={loading}
          role="switch"
          aria-checked={enabled}
          className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] disabled:opacity-50 ${
            enabled ? 'bg-[#818CF8]' : 'bg-[var(--border)]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

export default function NotificacoesClient({ initialEmailDigest, initialEmailWeeklyDigest }: Props) {
  const [emailDigest, setEmailDigest] = useState(initialEmailDigest)
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(initialEmailWeeklyDigest)
  const [loadingDigest, setLoadingDigest] = useState(false)
  const [loadingWeekly, setLoadingWeekly] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle(field: 'emailDigest' | 'emailWeeklyDigest', current: boolean) {
    const setLoading = field === 'emailDigest' ? setLoadingDigest : setLoadingWeekly
    const setValue = field === 'emailDigest' ? setEmailDigest : setEmailWeeklyDigest

    setLoading(true)
    setError(null)
    setValue(!current)

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !current }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setValue(current)
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <EmailCard
        title="E-mail diário"
        frequency="Todos os dias"
        description="Receba a pergunta do dia direto no seu e-mail, junto com as melhores respostas do dia anterior."
        detail="Enviado todos os dias de manhã (exceto domingos, quando você tiver o resumo semanal ativo)."
        enabled={emailDigest}
        loading={loadingDigest}
        onToggle={() => toggle('emailDigest', emailDigest)}
      />

      <EmailCard
        title="Resumo semanal"
        frequency="Domingos às 9h"
        description="Um recorte do que a comunidade pensou durante a semana: as perguntas que geraram mais conversa, a resposta mais votada e a pergunta de hoje."
        detail="Quando ativo junto com o e-mail diário, o resumo semanal substitui o envio de domingo — e já inclui a pergunta do dia."
        enabled={emailWeeklyDigest}
        loading={loadingWeekly}
        onToggle={() => toggle('emailWeeklyDigest', emailWeeklyDigest)}
      />

      {error && (
        <p className="text-sm text-red-400 mt-2">{error}</p>
      )}
    </div>
  )
}
