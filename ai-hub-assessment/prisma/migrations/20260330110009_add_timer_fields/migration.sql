-- AlterTable
ALTER TABLE "AssessmentAttempt" ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastResumedAt" TIMESTAMP(3),
ADD COLUMN     "timeUsedSeconds" INTEGER NOT NULL DEFAULT 0;
