'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  if (error) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Verificação falhou</h2>
          <p className="text-[var(--text-secondary)] mb-6 text-sm">{decodeURIComponent(error)}</p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full py-2 px-4 bg-[#818CF8] hover:bg-[#6366F1] text-white rounded font-semibold text-sm text-center transition-colors"
            >
              Ir para Login
            </Link>
            <Link
              href="/register"
              className="block w-full py-2 px-4 border border-[var(--border)] text-[var(--text-primary)] rounded text-sm text-center hover:border-[var(--text-secondary)] transition-colors"
            >
              Criar Nova Conta
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Verifique seu e-mail</h2>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
          Enviamos um link de verificação para o seu e-mail. Clique no link para ativar sua conta.
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-4">
          Não recebeu o e-mail? Verifique a pasta de spam.
        </p>
        <Link href="/login" className="block mt-6 text-sm text-[#818CF8] hover:underline">
          Voltar para o login
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-[#818CF8] border-t-transparent rounded-full" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
