-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailWeeklyDigest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailWeeklyDigestToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_emailWeeklyDigestToken_key" ON "User"("emailWeeklyDigestToken");
