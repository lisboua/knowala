'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const verified = searchParams.get('verified')
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      })

      // NextAuth v5 beta: result é undefined no sucesso; tem .error no falha
      if (result?.error) {
        if (
          result.error === 'CredentialsSignin' ||
          result.error === 'Configuration' ||
          result.error === 'CallbackRouteError'
        ) {
          setError('E-mail ou senha incorretos.')
        } else {
          setError(result.error)
        }
      } else if (result && result.ok === false) {
        // result existe mas falhou sem campo error explícito
        setError('E-mail ou senha incorretos.')
      } else {
        // sucesso: result === undefined (v5) ou result.ok === true (v4)
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch {
      setError('Erro ao entrar com Google.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-[#818CF8] font-bold text-3xl">
            Knowala
          </Link>
          <p className="text-[var(--text-secondary)] mt-2 text-sm">Entre para participar</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          {verified && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400">
              E-mail verificado com sucesso! Faça login para continuar.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Google OAuth — oculto durante o beta fechado */}
          {/* <Button
            type="button"
            variant="secondary"
            className="w-full mb-4"
            onClick={handleGoogleSignIn}
            loading={googleLoading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar com Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[var(--bg-card)] text-[var(--text-secondary)]">ou</span>
            </div>
          </div> */}

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
            <div>
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                autoComplete="current-password"
              />
              <div className="mt-1 text-right">
                <Link href="/forgot-password" className="text-xs text-[#818CF8] hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-[#818CF8] hover:underline font-medium">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-[#818CF8] border-t-transparent rounded-full" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
