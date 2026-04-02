'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface VoteButtonsProps {
  targetId: string
  targetType: 'answer' | 'comment'
  initialUpvotes: number
  initialDownvotes: number
  userVote: number | null // 1, -1, or null
  isAuthenticated: boolean
}

export default function VoteButtons({
  targetId,
  targetType,
  initialUpvotes,
  initialDownvotes,
  userVote: initialUserVote,
  isAuthenticated,
}: VoteButtonsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [userVote, setUserVote] = useState<number | null>(initialUserVote)

  const score = upvotes - downvotes

  async function handleVote(value: 1 | -1) {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Optimistic update
    const prevVote = userVote
    const prevUpvotes = upvotes
    const prevDownvotes = downvotes

    let newValue: 1 | -1 | 0 = value

    // Toggle off if same vote
    if (userVote === value) {
      newValue = 0
      setUserVote(null)
      if (value === 1) setUpvotes((u) => u - 1)
      else setDownvotes((d) => d - 1)
    } else {
      // Switch vote
      if (userVote === 1) setUpvotes((u) => u - 1)
      if (userVote === -1) setDownvotes((d) => d - 1)
      if (value === 1) setUpvotes((u) => u + 1)
      if (value === -1) setDownvotes((d) => d + 1)
      setUserVote(value)
    }

    startTransition(async () => {
      try {
        const endpoint =
          targetType === 'answer'
            ? `/api/answers/${targetId}/vote`
            : `/api/comments/${targetId}/vote`

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: newValue }),
        })

        if (!res.ok) {
          // Revert on error
          setUpvotes(prevUpvotes)
          setDownvotes(prevDownvotes)
          setUserVote(prevVote)
          const data = await res.json()
          console.error('Vote failed:', data.error)
        } else {
          const data = await res.json()
          if (data.success) {
            setUpvotes(data.data.upvotes)
            setDownvotes(data.data.downvotes)
            setUserVote(data.data.userVote)
          }
        }
      } catch {
        setUpvotes(prevUpvotes)
        setDownvotes(prevDownvotes)
        setUserVote(prevVote)
      }
    })
  }

  const isVertical = targetType === 'answer'

  if (isVertical) {
    return (
      <div className="flex flex-col items-center gap-1 min-w-[32px]">
        <button
          onClick={() => handleVote(1)}
          disabled={isPending}
          aria-label="Upvote"
          className={`p-1 rounded transition-colors ${
            userVote === 1
              ? 'text-[#818CF8]'
              : 'text-[var(--text-secondary)] hover:text-[#818CF8]'
          } disabled:opacity-50`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 14h4v7a1 1 0 001 1h6a1 1 0 001-1v-7h4a1 1 0 00.77-1.64l-8-10a1 1 0 00-1.54 0l-8 10A1 1 0 004 14z" />
          </svg>
        </button>
        <span
          className={`text-xs font-bold ${
            score > 0 ? 'text-[#818CF8]' : score < 0 ? 'text-[#7193ff]' : 'text-[var(--text-secondary)]'
          }`}
        >
          {score}
        </span>
        <button
          onClick={() => handleVote(-1)}
          disabled={isPending}
          aria-label="Downvote"
          className={`p-1 rounded transition-colors ${
            userVote === -1
              ? 'text-[#7193ff]'
              : 'text-[var(--text-secondary)] hover:text-[#7193ff]'
          } disabled:opacity-50`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 10h-4V3a1 1 0 00-1-1H9a1 1 0 00-1 1v7H4a1 1 0 00-.77 1.64l8 10a1 1 0 001.54 0l8-10A1 1 0 0020 10z" />
          </svg>
        </button>
      </div>
    )
  }

  // Horizontal for comments
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={isPending}
        aria-label="Upvote"
        className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors ${
          userVote === 1
            ? 'text-[#818CF8]'
            : 'text-[var(--text-secondary)] hover:text-[#818CF8]'
        } disabled:opacity-50`}
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 14h4v7a1 1 0 001 1h6a1 1 0 001-1v-7h4a1 1 0 00.77-1.64l-8-10a1 1 0 00-1.54 0l-8 10A1 1 0 004 14z" />
        </svg>
        <span>{upvotes}</span>
      </button>
      <button
        onClick={() => handleVote(-1)}
        disabled={isPending}
        aria-label="Downvote"
        className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors ${
          userVote === -1
            ? 'text-[#7193ff]'
            : 'text-[var(--text-secondary)] hover:text-[#7193ff]'
        } disabled:opacity-50`}
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 10h-4V3a1 1 0 00-1-1H9a1 1 0 00-1 1v7H4a1 1 0 00-.77 1.64l8 10a1 1 0 001.54 0l8-10A1 1 0 0020 10z" />
        </svg>
        <span>{downvotes}</span>
      </button>
    </div>
  )
}
