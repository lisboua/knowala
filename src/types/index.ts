import { Role, QuestionStatus, VoteTarget, ReportTarget, ReportStatus } from '@prisma/client'

export type { Role, QuestionStatus, VoteTarget, ReportTarget, ReportStatus }

export interface UserSession {
  id: string
  name: string
  username: string
  email: string
  image?: string | null
  role: Role
  ecoScore: number
}

export interface BadgeData {
  key: string
  name: string
  description: string
  icon: string
}

export interface UserBadgeWithBadge {
  id: string
  awardedAt: Date
  badge: BadgeData
}

export interface VoteWithRelation {
  id: string
  userId: string
  targetType: VoteTarget
  value: number
  answerId: string | null
  commentId: string | null
  createdAt: Date
}

export interface CommentWithRelations {
  id: string
  content: string
  userId: string
  answerId: string
  parentId: string | null
  deletedByMod: boolean
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    username: string
    image: string | null
    ecoScore: number
  }
  votes: VoteWithRelation[]
  replies: CommentWithRelations[]
  _count?: {
    votes: number
  }
}

export interface AnswerWithRelations {
  id: string
  content: string
  userId: string
  questionId: string
  deletedByMod: boolean
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    username: string
    image: string | null
    ecoScore: number
  }
  comments: CommentWithRelations[]
  votes: VoteWithRelation[]
  _count?: {
    comments: number
    votes: number
  }
}

export interface QuestionWithAnswers {
  id: string
  content: string
  slug: string | null
  publishedAt: Date | null
  scheduledFor: Date | null
  status: QuestionStatus
  createdAt: Date
  answers: AnswerWithRelations[]
}

export interface ReportWithRelations {
  id: string
  userId: string
  targetType: ReportTarget
  reason: string
  status: ReportStatus
  answerId: string | null
  commentId: string | null
  createdAt: Date
  user: {
    id: string
    name: string
    username: string
  }
  answer?: {
    id: string
    content: string
    user: {
      name: string
      username: string
    }
  } | null
  comment?: {
    id: string
    content: string
    user: {
      name: string
      username: string
    }
  } | null
}

export interface ContentFilterResult {
  valid: boolean
  reason?: string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
