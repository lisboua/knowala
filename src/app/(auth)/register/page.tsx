'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AVATARS } from '@/lib/avatars'

// ==========================================
// WAITLIST FORM (default — no invite code)
// ==========================================

function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('E-mail inválido.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao entrar na lista de espera.')
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
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Você está na lista!</h2>
          <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">
            Vamos te avisar em <strong className="text-[var(--text-primary)]">{email}</strong> assim
            que o Knowala estiver aberto ao público.
          </p>
          <Link
            href="/"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← Voltar para o início
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-[#818CF8] font-bold text-3xl inline-block">
            Knowala
          </Link>
          <div className="mt-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/20 text-xs font-semibold text-[#818CF8]">
              🔒 Beta Fechado
            </span>
          </div>
          <p className="text-[var(--text-secondary)] mt-3 text-sm leading-relaxed">
            Estamos em fase de beta fechado com um grupo seleto de pessoas.
            <br />
            Deixe seu e-mail para ser notificado quando abrirmos ao público!
          </p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Seu e-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />

            <Button type="submit" className="w-full" loading={loading}>
              Entrar na lista de espera
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-[#818CF8] hover:underline font-medium">
            Entrar
          </Link>
        </p>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">
          Recebeu um convite?{' '}
          <Link href="/register?invite=" className="text-[#818CF8] hover:underline font-medium">
            Usar código de convite
          </Link>
        </p>
      </div>
    </div>
  )
}

// ==========================================
// REGISTER FORM (with invite code)
// ==========================================

function RegisterWithInviteForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const inviteParam = searchParams.get('invite') || ''

  const [inviteCode, setInviteCode] = useState(inviteParam)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!inviteCode.trim()) {
      newErrors.inviteCode = 'Código de convite é obrigatório.'
    }

    if (username.trim().length < 3) {
      newErrors.username = 'Nome de usuário deve ter pelo menos 3 caracteres.'
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      newErrors.username = 'Use apenas letras, números e underline.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido.'
    }

    if (password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres.'
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Senha deve conter pelo menos uma letra maiúscula.'
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Senha deve conter pelo menos um número.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.toLowerCase().trim(),
          password,
          avatar: selectedAvatar || undefined,
          inviteCode: inviteCode.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ general: data.error || 'Erro ao criar conta.' })
      } else {
        setSuccess(true)
      }
    } catch {
      setErrors({ general: 'Erro de conexão. Tente novamente.' })
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
            Se o e-mail <strong className="text-[var(--text-primary)]">{email}</strong> não estiver cadastrado,
            você receberá um link de confirmação em breve.
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Não recebeu?{' '}
            <button
              onClick={() => setSuccess(false)}
              className="text-[#818CF8] hover:underline"
            >
              Tentar novamente
            </button>
          </p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="block mt-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
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
          <p className="text-[var(--text-secondary)] mt-2 text-sm">Crie sua conta com convite</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              {errors.general}
            </div>
          )}

          {/* Invite Code Field */}
          <div className="mb-4">
            <Input
              label="Código de convite"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Ex: a1b2c3d4e5f6"
              error={errors.inviteCode}
              required
              autoComplete="off"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Escolha seu avatar</label>
              <div className="grid grid-cols-8 gap-2">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.path)}
                    className={`relative w-9 h-9 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                      selectedAvatar === avatar.path
                        ? 'border-[#818CF8] ring-2 ring-[#818CF8]/30'
                        : 'border-[var(--border)] hover:border-[var(--text-secondary)]'
                    }`}
                    title={avatar.name}
                  >
                    <Image src={avatar.path} alt={avatar.name} fill className="object-cover" />
                  </button>
                ))}
              </div>
              {errors.avatar && <p className="text-xs text-red-400 mt-1">{errors.avatar}</p>}
            </div>

            <Input
              label="Nome de usuário"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="seu_username"
              error={errors.username}
              hint="Use letras, números e underline. Mínimo 3 caracteres."
              required
              autoComplete="username"
            />
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              error={errors.email}
              required
              autoComplete="email"
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              error={errors.password}
              hint="Use pelo menos 8 caracteres, uma letra maiúscula e um número."
              required
              autoComplete="new-password"
            />

            <Button type="submit" className="w-full" loading={loading}>
              Criar Conta
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-[#818CF8] hover:underline font-medium">
            Entrar
          </Link>
        </p>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">
          Ao criar uma conta, você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  )
}

// ==========================================
// MAIN PAGE — routes between waitlist / register
// ==========================================

function RegisterPageContent() {
  const searchParams = useSearchParams()
  const hasInvite = searchParams.has('invite')

  if (hasInvite) {
    return <RegisterWithInviteForm />
  }

  return <WaitlistForm />
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-[#818CF8] border-t-transparent rounded-full" /></div>}>
      <RegisterPageContent />
    </Suspense>
  )
}
