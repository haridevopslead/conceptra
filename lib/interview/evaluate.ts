import { anthropic } from "@/lib/ai";

export type EvalInput = {
  question: string;
  answer: string;
  topic?: string;
  difficulty?: string;
};

export type EvalResult = {
  overall_score: number;
  depth_score: number;
  accuracy_score: number;
  production_awareness_score: number;
  what_was_strong: string;
  what_was_weak: string;
  ideal_answer: string;
};

export class EvaluationError extends Error {}

// Single source of truth for Depth/Accuracy/Production Awareness scoring.
// Used by both the authenticated practice flow and the public /try flow.
export async function evaluateAnswer({
  question,
  answer,
  topic,
  difficulty,
}: EvalInput): Promise<EvalResult> {
  const topicCtx = topic ?? "General DevOps";
  const difficultyCtx = difficulty ?? "Intermediate";

  const difficultyGuidance =
    difficultyCtx === "Beginner"
      ? "This is a Beginner candidate. Reward correct fundamentals and be encouraging. Do not penalize for missing advanced edge cases or production-specific nuance — focus on whether they understand the core concept."
      : difficultyCtx === "Senior"
      ? "This is a Senior candidate. Hold them to a high bar. Expect production-grade answers with specific trade-offs, failure modes, real numbers, and incident-level reasoning. Generic or surface-level answers should score 4 or below."
      : "This is an Intermediate candidate. Expect practical usage and some production knowledge. Penalize vague hand-waving but reward correct practical examples.";

  const prompt = `You are a senior DevOps interviewer at a top tech company evaluating a candidate's answer on the topic of ${topicCtx}.

Difficulty level: ${difficultyCtx}
${difficultyGuidance}

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
    throw new EvaluationError("Malformed evaluation response");
  }

  try {
    return JSON.parse(match[0]) as EvalResult;
  } catch {
    throw new EvaluationError("Failed to parse evaluation JSON");
  }
}
