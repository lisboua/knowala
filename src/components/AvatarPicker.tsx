'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AVATARS } from '@/lib/avatars'
import Modal from './ui/Modal'

interface AvatarPickerProps {
  currentImage: string | null
  userName: string
}

export default function AvatarPicker({ currentImage, userName }: AvatarPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(currentImage)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSave() {
    if (!selected) return

    setSaving(true)
    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: selected }),
      })

      if (res.ok) {
        setIsOpen(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative"
        title="Trocar avatar"
      >
        {currentImage ? (
          <Image
            src={currentImage}
            alt={userName}
            width={72}
            height={72}
            className="rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full bg-[#818CF8] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {userName[0].toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Escolha seu avatar">
        <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1">
          {AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelected(avatar.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                selected === avatar.path
                  ? 'bg-[#818CF8]/20 ring-2 ring-[#818CF8]'
                  : 'hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Image
                src={avatar.path}
                alt={avatar.name}
                width={56}
                height={56}
                className="rounded-full"
              />
              <span className="text-xs text-[var(--text-secondary)]">{avatar.name}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[var(--border)]">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selected || selected === currentImage}
            className="px-4 py-2 text-sm bg-[#818CF8] hover:bg-[#6366F1] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-semibold transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </Modal>
    </>
  )
}
