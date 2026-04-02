'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Link inválido</h2>
          <p className="text-[var(--text-secondary)] mb-6 text-sm">
            O link de redefinição de senha é inválido ou está incompleto.
          </p>
          <Link
            href="/forgot-password"
            className="block w-full py-2 px-4 bg-[#818CF8] hover:bg-[#6366F1] text-white rounded font-semibold text-sm text-center transition-colors"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Senha redefinida!</h2>
          <p className="text-[var(--text-secondary)] mb-6 text-sm">
            Sua senha foi alterada com sucesso. Faça login com a nova senha.
          </p>
          <Link
            href="/login"
            className="block w-full py-2 px-4 bg-[#818CF8] hover:bg-[#6366F1] text-white rounded font-semibold text-sm text-center transition-colors"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    )
  }

  function validate(): string | null {
    if (password.length < 8) return 'Senha deve ter pelo menos 8 caracteres.'
    if (!/[A-Z]/.test(password)) return 'Senha deve conter pelo menos uma letra maiúscula.'
    if (!/[0-9]/.test(password)) return 'Senha deve conter pelo menos um número.'
    if (password !== confirmPassword) return 'As senhas não coincidem.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao redefinir senha. Tente novamente.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-[#818CF8] font-bold text-3xl">
            Knowala
          </Link>
          <p className="text-[var(--text-secondary)] mt-2 text-sm">Crie uma nova senha</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nova senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              hint="Use pelo menos 8 caracteres, uma letra maiúscula e um número."
              required
              autoComplete="new-password"
            />
            <Input
              label="Confirmar senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              required
              autoComplete="new-password"
            />

            <Button type="submit" className="w-full" loading={loading}>
              Redefinir senha
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
          <Link href="/login" className="text-[#818CF8] hover:underline font-medium">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-[#818CF8] border-t-transparent rounded-full" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
