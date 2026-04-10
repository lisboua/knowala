-- Add email digest fields to User
ALTER TABLE "User" ADD COLUMN "emailDigest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailDigestToken" TEXT;
CREATE UNIQUE INDEX "User_emailDigestToken_key" ON "User"("emailDigestToken");

-- Create NotificationType enum
CREATE TYPE "NotificationType" AS ENUM (
  'ANSWER_UPVOTE',
  'ANSWER_COMMENT',
  'COMMENT_REPLY',
  'MILESTONE',
  'BADGE_EARNED',
  'DAILY_QUESTION'
);

-- Create Notification table
CREATE TABLE "Notification" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "type"      "NotificationType" NOT NULL,
  "read"      BOOLEAN NOT NULL DEFAULT false,
  "link"      TEXT,
  "actorId"   TEXT,
  "entityId"  TEXT,
  "meta"      JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- Foreign keys
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
