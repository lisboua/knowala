'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import VoteButtons from './VoteButtons'
import BookmarkButton from './BookmarkButton'
import Comment from './Comment'
import CommentForm from './CommentForm'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { AnswerWithRelations } from '@/types'

interface AnswerProps {
  answer: AnswerWithRelations
  currentUserId?: string
  isAuthenticated: boolean
  isBookmarked?: boolean
  bookmarkedCommentIds?: string[]
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes} min atrás`
  if (hours < 24) return `${hours}h atrás`
  if (days < 30) return `${days}d atrás`
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

export default function Answer({ answer, currentUserId, isAuthenticated, isBookmarked = false, bookmarkedCommentIds = [] }: AnswerProps) {
  const [showComments, setShowComments] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportError, setReportError] = useState('')
  const [reportSuccess, setReportSuccess] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(answer.content)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [currentContent, setCurrentContent] = useState(answer.content)
  const [currentEditedAt, setCurrentEditedAt] = useState<Date | null>(answer.editedAt)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  const upvotes = getVoteCount(answer.votes, 1)
  const downvotes = getVoteCount(answer.votes, -1)
  const userVote = getUserVote(answer.votes, currentUserId)
  const topComments = answer.comments.filter((c) => !c.parentId)
  const commentCount = answer.comments.length

  if (answer.deletedByMod) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 mb-3">
        <p className="text-sm italic text-[var(--text-secondary)]">
          Este conteúdo foi removido pela moderação.
        </p>
      </div>
    )
  }

  async function handleReport() {
    if (!reportReason.trim()) {
      setReportError('Por favor, informe o motivo.')
      return
    }

    setIsReporting(true)
    setReportError('')

    try {
      const res = await fetch(`/api/answers/${answer.id}/report`, {
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
      const res = await fetch(`/api/answers/${answer.id}`, {
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
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg mb-3 flex">
      {/* Vote column */}
      <div className="flex-shrink-0 w-12 bg-[var(--bg-hover)] rounded-l-lg flex flex-col items-center py-3 px-1">
        <VoteButtons
          targetId={answer.id}
          targetType="answer"
          initialUpvotes={upvotes}
          initialDownvotes={downvotes}
          userVote={userVote}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-3 min-w-0">
        {/* User info */}
        <div className="flex items-center gap-2 mb-2">
          {answer.user.image ? (
            <Image
              src={answer.user.image}
              alt={answer.user.name}
              width={24}
              height={24}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#818CF8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {answer.user.name[0].toUpperCase()}
            </div>
          )}
          <Link
            href={`/profile/${answer.user.username}`}
            className="text-xs font-semibold text-[var(--text-primary)] hover:text-[#818CF8] transition-colors"
          >
            u/{answer.user.username}
          </Link>
          <span className="text-xs text-[var(--text-secondary)]">·</span>
          <span className="text-xs text-[var(--text-secondary)]">{formatRelativeTime(answer.createdAt)}</span>
          <span className="text-xs text-[var(--text-secondary)]">·</span>
          <span className="text-xs text-[#818CF8] font-semibold">⚡ {answer.user.ecoScore}</span>
        </div>

        {/* Answer content */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              ref={editTextareaRef}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              maxLength={5000}
              className="w-full bg-[var(--bg-primary)] border border-[#818CF8] rounded px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none resize-none overflow-hidden"
              onFocus={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
            />
            {editError && <p className="text-xs text-red-500 mt-1">{editError}</p>}
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-[var(--text-secondary)]">{editContent.length}/5000</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsEditing(false); setEditContent(currentContent); setEditError(null) }}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1"
                >
                  Cancelar
                </button>
                <Button size="sm" onClick={handleSaveEdit} loading={isSavingEdit} disabled={editContent.length < 10}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3 whitespace-pre-wrap break-words">
            {currentContent}
          </p>
        )}
        {currentEditedAt && !isEditing && (
          <p className="text-xs text-[var(--text-secondary)] mb-2 italic">
            editado {formatRelativeTime(currentEditedAt)}
          </p>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => {
              setShowComments(!showComments)
              if (!showComments) setShowCommentForm(false)
            }}
            className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {commentCount} {commentCount === 1 ? 'comentário' : 'comentários'}
          </button>

          {isAuthenticated && (
            <button
              onClick={() => {
                setShowCommentForm(!showCommentForm)
                setShowComments(true)
              }}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
            >
              Comentar
            </button>
          )}

          {isAuthenticated && answer.userId === currentUserId && (
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
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
            >
              Editar
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <BookmarkButton
              targetType="ANSWER"
              targetId={answer.id}
              initialIsBookmarked={isBookmarked}
              isAuthenticated={isAuthenticated}
            />
            {isAuthenticated && answer.userId !== currentUserId && (
              <button
                onClick={() => setShowReportModal(true)}
                className="text-[var(--text-secondary)] hover:text-red-400 transition-colors"
              >
                Denunciar
              </button>
            )}
          </div>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 border-t border-[var(--border)] pt-3">
            {showCommentForm && (
              <div className="mb-3">
                <CommentForm
                  answerId={answer.id}
                  isAuthenticated={isAuthenticated}
                  onCancel={() => setShowCommentForm(false)}
                  onSuccess={() => setShowCommentForm(false)}
                />
              </div>
            )}

            <div className="space-y-1">
              {topComments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  isAuthenticated={isAuthenticated}
                  isBookmarked={bookmarkedCommentIds.includes(comment.id)}
                />
              ))}
              {topComments.length === 0 && !showCommentForm && (
                <p className="text-xs text-[var(--text-secondary)]">Nenhum comentário ainda. Seja o primeiro!</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Report modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Denunciar Resposta" size="sm">
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
