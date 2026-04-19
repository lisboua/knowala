'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import VoteButtons from './VoteButtons'
import BookmarkButton from './BookmarkButton'
import CommentForm from './CommentForm'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { CommentWithRelations } from '@/types'

interface CommentProps {
  comment: CommentWithRelations
  currentUserId?: string
  isAuthenticated: boolean
  depth?: number
  isBookmarked?: boolean
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min`
  if (hours < 24) return `${hours}h`
  if (days < 30) return `${days}d`
  return new Date(date).toLocaleDateString('pt-BR')
}

function getVoteCount(votes: Array<{ value: number }>, value: number): number {
  return votes.filter((v) => v.value === value).length
}

function getUserVote(
  votes: Array<{ userId: string; value: number; answerId?: string | null; commentId?: string | null }>,
  userId?: string
): number | null {
  if (!userId) return null
  const vote = votes.find((v) => v.userId === userId)
  return vote ? vote.value : null
}

export default function Comment({
  comment,
  currentUserId,
  isAuthenticated,
  depth = 0,
  isBookmarked = false,
}: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportError, setReportError] = useState('')
  const [reportSuccess, setReportSuccess] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [currentContent, setCurrentContent] = useState(comment.content)
  const [currentEditedAt, setCurrentEditedAt] = useState<Date | null>(comment.editedAt)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  const upvotes = getVoteCount(comment.votes, 1)
  const downvotes = getVoteCount(comment.votes, -1)
  const userVote = getUserVote(comment.votes, currentUserId)

  if (comment.deletedByMod) {
    return (
      <div className={`${depth > 0 ? 'ml-6 pl-3 border-l border-[var(--border)]' : ''}`}>
        <p className="text-xs italic text-[var(--text-secondary)] py-2">
          Este conteúdo foi removido pela moderação.
        </p>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                isAuthenticated={isAuthenticated}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  async function handleReport() {
    if (!reportReason.trim()) {
      setReportError('Por favor, informe o motivo da denúncia.')
      return
    }

    setIsReporting(true)
    setReportError('')

    try {
      const res = await fetch(`/api/comments/${comment.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      })

      const data = await res.json()
      if (!res.ok) {
        setReportError(data.error || 'Erro ao enviar denúncia.')
      } else {
        setReportSuccess(true)
      }
    } catch {
      setReportError('Erro ao enviar denúncia.')
    } finally {
      setIsReporting(false)
    }
  }

  async function handleSaveEdit() {
    if (!editContent.trim() || editContent.trim() === currentContent) {
      setIsEditing(false)
      return
    }
    setIsSavingEdit(true)
    setEditError(null)
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setEditError(data.error || 'Erro ao salvar.')
      } else {
        setCurrentContent(data.data.content)
        setEditContent(data.data.content)
        setCurrentEditedAt(new Date(data.data.editedAt))
        setIsEditing(false)
      }
    } catch {
      setEditError('Erro ao salvar. Tente novamente.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-3 border-l border-[var(--border)]' : ''}`}>
      <div className="py-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          {comment.user.image ? (
            <Image
              src={comment.user.image}
              alt={comment.user.name}
              width={20}
              height={20}
              className="rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#818CF8] flex items-center justify-center text-white text-xs font-bold">
              {comment.user.name[0].toUpperCase()}
            </div>
          )}
          <Link
            href={`/profile/${comment.user.username}`}
            className="text-xs font-semibold text-[var(--text-primary)] hover:text-[#818CF8] transition-colors"
          >
            u/{comment.user.username}
          </Link>
          <span className="text-xs text-[var(--text-secondary)]">·</span>
          <span className="text-xs text-[var(--text-secondary)]">{formatRelativeTime(comment.createdAt)}</span>
          <span className="text-xs text-[var(--text-secondary)]">·</span>
          <span className="text-xs text-[var(--text-secondary)]">⚡ {comment.user.ecoScore}</span>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mb-2">
            <textarea
              ref={editTextareaRef}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              maxLength={1000}
              className="w-full bg-[var(--bg-primary)] border border-[#818CF8] rounded px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none resize-none overflow-hidden"
              onFocus={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
            />
            {editError && <p className="text-xs text-red-500 mt-1">{editError}</p>}
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-[var(--text-secondary)]">{editContent.length}/1000</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsEditing(false); setEditContent(currentContent); setEditError(null) }}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1"
                >
                  Cancelar
                </button>
                <Button size="sm" onClick={handleSaveEdit} loading={isSavingEdit} disabled={editContent.length < 2}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-2 whitespace-pre-wrap break-words">
            {currentContent}
          </p>
        )}
        {currentEditedAt && !isEditing && (
          <p className="text-xs text-[var(--text-secondary)] mb-1 italic">
            editado {formatRelativeTime(currentEditedAt)}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <VoteButtons
            targetId={comment.id}
            targetType="comment"
            initialUpvotes={upvotes}
            initialDownvotes={downvotes}
            userVote={userVote}
            isAuthenticated={isAuthenticated}
          />
          {depth === 0 && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
            >
              Responder
            </button>
          )}
          {isAuthenticated && comment.userId === currentUserId && (
            <button
              onClick={() => {
                setIsEditing(true)
                setTimeout(() => {
                  if (editTextareaRef.current) {
                    editTextareaRef.current.focus()
                    editTextareaRef.current.style.height = 'auto'
                    editTextareaRef.current.style.height = editTextareaRef.current.scrollHeight + 'px'
                  }
                }, 0)
              }}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
            >
              Editar
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <BookmarkButton
              targetType="COMMENT"
              targetId={comment.id}
              initialIsBookmarked={isBookmarked}
              isAuthenticated={isAuthenticated}
            />
            {isAuthenticated && comment.userId !== currentUserId && (
              <button
                onClick={() => setShowReportModal(true)}
                className="text-xs text-[var(--text-secondary)] hover:text-red-400 transition-colors"
              >
                Denunciar
              </button>
            )}
          </div>
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-2">
            <CommentForm
              answerId={comment.answerId}
              parentId={comment.id}
              isAuthenticated={isAuthenticated}
              onCancel={() => setShowReplyForm(false)}
              onSuccess={() => setShowReplyForm(false)}
              placeholder="Responder ao comentário..."
            />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-1">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isAuthenticated={isAuthenticated}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Report modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Denunciar Comentário" size="sm">
        {reportSuccess ? (
          <div className="text-center py-2">
            <p className="text-green-400 font-medium">Denúncia enviada com sucesso.</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Nossa equipe irá analisar o conteúdo.</p>
            <Button className="mt-4" onClick={() => setShowReportModal(false)}>Fechar</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">Explique o motivo da denúncia:</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Ex: Conteúdo ofensivo, spam, desinformação..."
              rows={3}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[#818CF8] resize-none"
            />
            {reportError && <p className="text-xs text-red-500">{reportError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowReportModal(false)}>Cancelar</Button>
              <Button variant="danger" size="sm" onClick={handleReport} loading={isReporting}>Enviar Denúncia</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
