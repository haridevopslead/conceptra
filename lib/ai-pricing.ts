// Per-unit AI provider rates, as of 2026-07-19 — the inputs computedCostUsd
// (AiCostLog) is derived from at write time. Raw usage (tokens/seconds) is
// stored alongside the computed dollar figure, not instead of it, so a rate
// change here doesn't strand old rows — they can be re-priced later from the
// stored usage. Update the constants below (not historical rows) when a
// provider changes pricing.

// Claude Haiku 4.5 (claude-haiku-4-5-20251001) — the model behind both Hari
// chat (app/api/interview/dev/route.ts) and Quick Practice grading
// (lib/interview/evaluate.ts). https://platform.claude.com/docs/en/about-claude/pricing
export const HAIKU_INPUT_COST_PER_TOKEN_USD = 1 / 1_000_000; // $1 / M input tokens
export const HAIKU_OUTPUT_COST_PER_TOKEN_USD = 5 / 1_000_000; // $5 / M output tokens

// Groq's whisper-large-v3-turbo (lib/interview/transcribe.ts) — confirmed
// against console.groq.com pricing, not the whisper-large-v3 (non-turbo)
// rate, which is ~3x higher. Groq bills with a 10-second minimum per
// request; GROQ_WHISPER_MIN_BILLED_SECONDS reflects that in computedCostUsd,
// while the stored audioSeconds field keeps the true measured duration.
export const GROQ_WHISPER_COST_PER_SECOND_USD = 0.04 / 3600; // $0.04 / hour
export const GROQ_WHISPER_MIN_BILLED_SECONDS = 10;

export function computeHaikuCostUsd(
  inputTokens: number | null | undefined,
  outputTokens: number | null | undefined
): number {
  return (inputTokens ?? 0) * HAIKU_INPUT_COST_PER_TOKEN_USD + (outputTokens ?? 0) * HAIKU_OUTPUT_COST_PER_TOKEN_USD;
}

export function computeGroqWhisperCostUsd(audioSeconds: number | null | undefined): number {
  const billedSeconds = Math.max(audioSeconds ?? 0, GROQ_WHISPER_MIN_BILLED_SECONDS);
  return billedSeconds * GROQ_WHISPER_COST_PER_SECOND_USD;
}
