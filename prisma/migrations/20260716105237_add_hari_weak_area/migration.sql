-- CreateTable
CREATE TABLE "HariWeakArea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HariWeakArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HariWeakArea_userId_topic_idx" ON "HariWeakArea"("userId", "topic");

-- AddForeignKey
ALTER TABLE "HariWeakArea" ADD CONSTRAINT "HariWeakArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
