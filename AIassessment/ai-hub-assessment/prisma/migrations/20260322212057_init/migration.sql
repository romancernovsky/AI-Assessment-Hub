-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'taker',
    "externalId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "feedbackId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "rating" INTEGER,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedbackId")
);

-- CreateTable
CREATE TABLE "BankVersion" (
    "versionId" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "publishedBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionCount" INTEGER NOT NULL,
    "dimensionConfig" JSONB NOT NULL,
    "competencyConfig" JSONB NOT NULL,
    "questions" JSONB NOT NULL,

    CONSTRAINT "BankVersion_pkey" PRIMARY KEY ("versionId")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankVersionId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "toolsDaily" JSONB NOT NULL DEFAULT '[]',
    "toolsWeekly" JSONB NOT NULL DEFAULT '[]',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "answers" JSONB NOT NULL DEFAULT '{}',
    "dimScores" JSONB,
    "overallScore" DOUBLE PRECISION,
    "badge" TEXT,
    "badgeExpiresAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("attemptId")
);

-- CreateTable
CREATE TABLE "QuestionReaction" (
    "reactionId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "vote" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionReaction_pkey" PRIMARY KEY ("reactionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_bankVersionId_fkey" FOREIGN KEY ("bankVersionId") REFERENCES "BankVersion"("versionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReaction" ADD CONSTRAINT "QuestionReaction_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("attemptId") ON DELETE RESTRICT ON UPDATE CASCADE;
