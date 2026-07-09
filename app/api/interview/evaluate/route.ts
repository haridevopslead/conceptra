import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { evaluateAnswer, EvaluationError } from "@/lib/interview/evaluate";
import { recordPracticeStreak } from "@/lib/streak";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question, answer, topic, difficulty } = await req.json();
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: "Missing question or answer" }, { status: 400 });
  }

  const topicCtx = topic ?? "General DevOps";

  let result;
  try {
    result = await evaluateAnswer({ question, answer, topic, difficulty });
  } catch (err) {
    const message = err instanceof EvaluationError ? err.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Save the interview result — fire-and-forget so a DB error never blocks the response
  const score = typeof result.overall_score === "number" ? result.overall_score : 0;
  db.interviewSession.create({
    data: { userId: session.user.id, score, topic: topicCtx },
  }).catch(() => { /* silent — don't break the UX for a logging failure */ });

  recordPracticeStreak(session.user.id).catch(() => { /* silent — streak update is non-critical */ });

  return NextResponse.json(result);
}
