'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type NotificationType =
  | 'ANSWER_UPVOTE'
  | 'ANSWER_COMMENT'
  | 'COMMENT_REPLY'
  | 'MILESTONE'
  | 'BADGE_EARNED'
  | 'DAILY_QUESTION'

interface Notification {
  id: string
  type: NotificationType
  read: boolean
  link: string | null
  entityId: string | null
  meta: Record<string, unknown> | null
  createdAt: string
  actor: { name: string; username: string; image: string | null } | null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

function notificationText(n: Notification): string {
  const actor = n.actor ? `u/${n.actor.username}` : 'Alguém'
  switch (n.type) {
    case 'ANSWER_UPVOTE':
      return `${actor} curtiu sua resposta`
    case 'ANSWER_COMMENT':
      return `${actor} comentou na sua resposta`
    case 'COMMENT_REPLY':
      return `${actor} respondeu seu comentário`
    case 'MILESTONE': {
      const count = (n.meta as { count?: number })?.count
      return `Sua resposta atingiu ${count} curtidas! 🎉`
    }
    case 'BADGE_EARNED': {
      const name = (n.meta as { badgeName?: string })?.badgeName
      return `Você ganhou o badge "${name}"!`
    }
    case 'DAILY_QUESTION':
      return 'A pergunta de hoje está no ar!'
    default:
      return 'Nova notificação'
  }
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0'
  switch (type) {
    case 'ANSWER_UPVOTE':
      return (
        <div className={`${base} bg-orange-500/15 text-orange-400`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4l8 8H4z" />
          </svg>
        </div>
      )
    case 'ANSWER_COMMENT':
    case 'COMMENT_REPLY':
      return (
        <div className={`${base} bg-blue-500/15 text-blue-400`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      )
    case 'MILESTONE':
      return (
        <div className={`${base} bg-yellow-500/15 text-yellow-400`}>
          <span>🎉</span>
        </div>
      )
    case 'BADGE_EARNED':
      return (
        <div className={`${base} bg-purple-500/15 text-purple-400`}>
          <span>🏅</span>
        </div>
      )
    case 'DAILY_QUESTION':
      return (
        <div className={`${base} bg-[#818CF8]/15 text-[#818CF8]`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const { data } = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // silently fail
    }
  }, [])

  // Initial fetch + polling every 60s
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function handleNotificationClick(n: Notification) {
    setOpen(false)
    if (!n.read) {
      await fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === n.id ? { ...notif, read: true } : notif))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    if (n.link) router.push(n.link)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        aria-label="Notificações"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl z-30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#818CF8] hover:text-[#6366F1] transition-colors font-medium"
              >
                Marcar tudo como lido
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <svg className="w-10 h-10 text-[var(--text-secondary)] mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-[var(--text-secondary)]">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] transition-colors ${
                    !n.read ? 'bg-[#818CF8]/5' : ''
                  }`}
                >
                  <NotificationIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}>
                      {notificationText(n)}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 opacity-60">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-[#818CF8] flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
