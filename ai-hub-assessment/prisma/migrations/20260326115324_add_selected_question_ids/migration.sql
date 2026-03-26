-- AlterTable
ALTER TABLE "AssessmentAttempt" ADD COLUMN     "selectedQuestionIds" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'contentAdmin';
