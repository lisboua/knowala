import { db } from '@/lib/db'

export interface BookmarkSet {
  questionIds: Set<string>
  answerIds: Set<string>
  commentIds: Set<string>
}

export async function getUserBookmarkSet(userId: string): Promise<BookmarkSet> {
  const bookmarks = await db.bookmark.findMany({
    where: { userId },
    select: { questionId: true, answerId: true, commentId: true },
  })

  return {
    questionIds: new Set(bookmarks.flatMap(b => b.questionId ? [b.questionId] : [])),
    answerIds: new Set(bookmarks.flatMap(b => b.answerId ? [b.answerId] : [])),
    commentIds: new Set(bookmarks.flatMap(b => b.commentId ? [b.commentId] : [])),
  }
}
