-- CreateTable
CREATE TABLE "HariSessionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "openingQuestion" TEXT NOT NULL,
    "followUpQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HariSessionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HariSessionLog_userId_topic_createdAt_idx" ON "HariSessionLog"("userId", "topic", "createdAt");

-- AddForeignKey
ALTER TABLE "HariSessionLog" ADD CONSTRAINT "HariSessionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
