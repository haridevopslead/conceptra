import { NextRequest, NextResponse } from "next/server";
import { evaluateAnswer, EvaluationError } from "@/lib/interview/evaluate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Fixed question so this route can't be used as a free-form Claude proxy —
// only the answer is accepted from the client.
const TRY_QUESTION = "What happens when you run kubectl apply -f deployment.yaml?";
const TRY_TOPIC = "Kubernetes";
const TRY_DIFFICULTY = "Intermediate";

const DAILY_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_ANSWER_LENGTH = 3000;

export async function POST(req: NextRequest) {
  const { answer } = await req.json();
  if (!answer?.trim()) {
    return NextResponse.json({ error: "Missing answer" }, { status: 400 });
  }
  if (answer.length > MAX_ANSWER_LENGTH) {
    return NextResponse.json({ error: "Answer is too long" }, { status: 400 });
  }

  // Only requests that actually reach Claude count against the quota —
  // validation failures (empty/oversized answers) are free to retry.
  const ip = getClientIp(req.headers);
  const { allowed, remaining, resetAt } = checkRateLimit(`try:${ip}`, DAILY_LIMIT, WINDOW_MS);

  if (!allowed) {
    return NextResponse.json(
      {
        error: "You've used all your free tries for today. Sign up for unlimited practice.",
        resetAt,
      },
      { status: 429 }
    );
  }

  let result;
  try {
    // Anonymous flow — no userId to attribute AI cost to, so usage is
    // discarded here rather than logged (unlike the authenticated
    // Quick Practice route).
    ({ result } = await evaluateAnswer({
      question: TRY_QUESTION,
      answer,
      topic: TRY_TOPIC,
      difficulty: TRY_DIFFICULTY,
    }));
  } catch (err) {
    const message = err instanceof EvaluationError ? err.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ...result, remaining });
}
