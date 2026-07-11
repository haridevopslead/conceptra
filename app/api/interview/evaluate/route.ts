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

  // Save the interview result. Awaited (unlike before) because the client needs
  // the row id to bookmark it — but a DB failure still must not fail the response,
  // it just means no bookmark button renders for this result.
  const score = typeof result.overall_score === "number" ? result.overall_score : 0;
  let sessionId: string | null = null;
  try {
    const saved = await db.interviewSession.create({
      data: {
        userId: session.user.id,
        score,
        topic: topicCtx,
        depthScore: typeof result.depth_score === "number" ? result.depth_score : null,
        accuracyScore: typeof result.accuracy_score === "number" ? result.accuracy_score : null,
        productionAwarenessScore:
          typeof result.production_awareness_score === "number" ? result.production_awareness_score : null,
        question,
        answer,
        directAnswer: result.direct_answer,
        concreteExample: result.concrete_example,
        seniorInsight: result.senior_insight,
      },
      select: { id: true },
    });
    sessionId = saved.id;
  } catch {
    // silent — don't break the UX for a logging failure
  }

  recordPracticeStreak(session.user.id).catch(() => { /* silent — streak update is non-critical */ });

  return NextResponse.json({ ...result, sessionId });
}
