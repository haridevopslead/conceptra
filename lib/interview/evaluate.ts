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
  direct_answer: string;
  concrete_example: string;
  senior_insight: string;
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
  "direct_answer": "<1-2 sentences that answer the actual question immediately, before any elaboration>",
  "concrete_example": "<2-4 sentences: one real, specific example tying the concept to an actual system — not generic, must prove production experience>",
  "senior_insight": "<2-4 sentences: an honest limitation, trade-off, or 'here's when I'd avoid this' — the line that separates a 6/10 from a 9/10. Never generic praise.>"
}

Scoring rubric:
- overall_score: holistic quality of the complete answer
- depth_score: technical depth and nuance demonstrated (did they go beyond surface-level?)
- accuracy_score: factual correctness and precision of every claim made
- production_awareness_score: did the answer show real production experience — consequences, trade-offs, failure modes?

Be honest and specific. Vague praise or criticism is useless to the candidate.

TONE FOR direct_answer, concrete_example, and senior_insight — a learner reads these to learn the thought process, not just the content, so they must sound like a senior engineer actually talking, not a textbook or an AI summary:
- First-person, conversational, natural spoken cadence. Use contractions ("I'll", "it's", "doesn't", "won't").
- Signal phrases are encouraged where they fit naturally: "So actually,", "See,", "Let's say,", "But honestly,", "I'll be very frank —", or "right?" as a check-in with the listener.
- No bullet points, no "Firstly/Secondly/In conclusion", no dense compound sentences stacked with commas. Sound like someone answering out loud in an interview room, not writing documentation.
- senior_insight is the most important field and the hardest to fake. It must contain one specific, honest trade-off, limitation, or "here's when I'd actually avoid this" — never generic praise or a restatement of the direct answer. If the topic has no single dramatic trade-off, use a real operational one instead: cost, maintenance burden, a common failure mode, or a case where a simpler/managed alternative is better.

FORMATTING RULE — applies consistently across direct_answer, concrete_example, and senior_insight: wrap every command, flag, config key/value, file path, and exit code in single backticks, e.g. \`kubectl describe pod\`, \`initialDelaySeconds: 60\`, \`exit code 137\`, \`--dry-run\`, \`/etc/kubernetes/manifests\`. This is required, not optional — a learner should be able to scan each field and immediately spot every literal technical token. Do not backtick plain product/technology names (Kubernetes, MySQL, S3) unless they appear as part of a literal command or identifier.

If a real config snippet or command sequence genuinely strengthens concrete_example, you may include a short fenced block (\`\`\`, 2-6 lines, no more than one per field) instead of inline backticks for that portion — but only when it fits naturally without breaking the spoken cadence of the surrounding sentence.

FEW-SHOT CALIBRATION EXAMPLE — match this exact tone and structure (this is for a different question, shown only to calibrate voice, not content):
QUESTION: What is the difference between a Kubernetes Deployment and a StatefulSet?
{
  "direct_answer": "So actually, the simple way to put it is — Deployments are for pods where identity doesn't matter, StatefulSets are for pods where identity matters.",
  "concrete_example": "See, if I'm running something stateless, like an API server, I'll go with a Deployment — pods get created, get replaced, doesn't matter which one. But let's say I'm running MySQL, with one primary and one replica — now identity matters, right? Pod 0 has to always come back as pod 0, with the same storage attached, otherwise things will break.",
  "senior_insight": "But honestly, I'll be very frank — I try to avoid StatefulSets wherever possible. They are more painful operationally, scaling is slower, and if something fails, mostly you end up doing manual cleanup instead of Kubernetes handling it automatically. So for databases, if I get an option to run it as a managed service outside the cluster, I will prefer that only. A StatefulSet is solving 'which pod is this,' it is not solving 'is this reliable.'"
}

Now write direct_answer, concrete_example, and senior_insight for the ACTUAL question above (not the calibration example), in this exact tone, at the quality level of a 9/10 senior answer.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1536,
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
