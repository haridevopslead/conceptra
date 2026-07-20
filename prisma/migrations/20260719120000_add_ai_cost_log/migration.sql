-- CreateEnum
CREATE TYPE "AiFeature" AS ENUM ('HARI_CHAT', 'QUICK_PRACTICE', 'TRANSCRIBE');

-- CreateTable
CREATE TABLE "AiCostLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" "AiFeature" NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "audioSeconds" DOUBLE PRECISION,
    "characterCount" INTEGER,
    "computedCostUsd" DECIMAL(12,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCostLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiCostLog_userId_feature_createdAt_idx" ON "AiCostLog"("userId", "feature", "createdAt");

-- CreateIndex
CREATE INDEX "AiCostLog_feature_createdAt_idx" ON "AiCostLog"("feature", "createdAt");

-- AddForeignKey
ALTER TABLE "AiCostLog" ADD CONSTRAINT "AiCostLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
