'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AVATARS } from '@/lib/avatars'

export default function SetupPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!avatar) {
      setError('Escolha um avatar para continuar.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, avatar }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao salvar.')
        return
      }

      await update({ needsOnboarding: false })
      router.push('/')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bem-vindo ao Knowala!</h1>
          <p className="text-[var(--text-secondary)] mt-2">Escolha seu username e avatar para começar.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="ex: raposa42"
              minLength={3}
              maxLength={20}
              required
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[#818CF8]"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">3–20 caracteres, apenas letras, números e _</p>
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
              Avatar
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAvatar(a.path)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    avatar === a.path
                      ? 'bg-[#818CF8]/20 ring-2 ring-[#818CF8]'
                      : 'hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <Image src={a.path} alt={a.name} width={48} height={48} className="rounded-full" />
                  <span className="text-xs text-[var(--text-secondary)]">{a.name}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || !username || !avatar}
            className="w-full bg-[#818CF8] hover:bg-[#6366F1] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded font-semibold transition-colors"
          >
            {saving ? 'Salvando...' : 'Entrar no Knowala'}
          </button>
        </form>
      </div>
    </div>
  )
}
