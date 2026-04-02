'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao enviar. Tente novamente.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Verifique seu e-mail</h2>
          <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">
            Se o e-mail <strong className="text-[var(--text-primary)]">{email}</strong> estiver cadastrado,
            você receberá um link para redefinir sua senha.
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Não recebeu? Verifique a pasta de spam ou{' '}
            <button
              onClick={() => setSuccess(false)}
              className="text-[#818CF8] hover:underline"
            >
              tente novamente
            </button>
          </p>
          <Link href="/login" className="block mt-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-[#818CF8] font-bold text-3xl">
            Knowala
          </Link>
          <p className="text-[var(--text-secondary)] mt-2 text-sm">Recupere sua senha</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <p className="text-[var(--text-secondary)] text-sm mb-4">
            Informe o e-mail da sua conta e enviaremos um link para redefinir sua senha.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />

            <Button type="submit" className="w-full" loading={loading}>
              Enviar link de recuperação
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
          Lembrou a senha?{' '}
          <Link href="/login" className="text-[#818CF8] hover:underline font-medium">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  )
}
