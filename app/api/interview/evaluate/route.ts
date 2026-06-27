import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { anthropic } from "@/lib/ai";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question, answer } = await req.json();
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: "Missing question or answer" }, { status: 400 });
  }

  const prompt = `You are a senior DevOps interviewer at a top tech company evaluating a candidate's spoken answer.

QUESTION: ${question}

CANDIDATE'S ANSWER: ${answer}

Return ONLY valid JSON — no markdown, no code fences, no extra text. Use exactly this structure:
{
  "overall_score": <integer 1-10>,
  "depth_score": <integer 1-10>,
  "accuracy_score": <integer 1-10>,
  "production_awareness_score": <integer 1-10>,
  "what_was_strong": "<2-3 sentences on what the candidate got right, with specific technical terms>",
  "what_was_weak": "<2-3 sentences on what was missing, vague, or incorrect>",
  "ideal_answer": "<the complete 9/10 answer a senior engineer would give — 4-6 sentences, specific and production-aware>"
}

Scoring rubric:
- overall_score: holistic quality of the complete answer
- depth_score: technical depth and nuance demonstrated (did they go beyond surface-level?)
- accuracy_score: factual correctness and precision of every claim made
- production_awareness_score: did the answer show real production experience — consequences, trade-offs, failure modes?

Be honest and specific. Vague praise or criticism is useless to the candidate.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ error: "Malformed evaluation response" }, { status: 500 });
  }

  let result: Record<string, unknown>;
  try {
    result = JSON.parse(match[0]);
  } catch {
    return NextResponse.json({ error: "Failed to parse evaluation JSON" }, { status: 500 });
  }

  // Save the interview result — fire-and-forget so a DB error never blocks the response
  const score = typeof result.overall_score === "number" ? result.overall_score : 0;
  db.interviewSession.create({
    data: { userId: session.user.id, score },
  }).catch(() => { /* silent — don't break the UX for a logging failure */ });

  return NextResponse.json(result);
}
