import { db } from "@/lib/db";
import { computeGroqWhisperCostUsd, computeHaikuCostUsd } from "@/lib/ai-pricing";

// Fire-and-forget AiCostLog writes — same pattern as
// db.hariSessionLog.create(...).catch(() => {}) in
// app/api/interview/dev/route.ts. Logging cost data must never slow down or
// risk breaking the actual user-facing response, so callers should not await
// these; failures are logged server-side (not swallowed silently) since a
// recurring gap here would quietly corrupt pricing decisions.

export function logHariChatCost(params: {
  userId: string;
  inputTokens: number | null | undefined;
  outputTokens: number | null | undefined;
}): void {
  const { userId, inputTokens, outputTokens } = params;
  db.aiCostLog
    .create({
      data: {
        userId,
        feature: "HARI_CHAT",
        inputTokens: inputTokens ?? null,
        outputTokens: outputTokens ?? null,
        computedCostUsd: computeHaikuCostUsd(inputTokens, outputTokens),
      },
    })
    .catch((err) => console.error("[ai-cost] failed to log HARI_CHAT", { userId, err }));
}

export function logQuickPracticeCost(params: {
  userId: string;
  inputTokens: number | null | undefined;
  outputTokens: number | null | undefined;
}): void {
  const { userId, inputTokens, outputTokens } = params;
  db.aiCostLog
    .create({
      data: {
        userId,
        feature: "QUICK_PRACTICE",
        inputTokens: inputTokens ?? null,
        outputTokens: outputTokens ?? null,
        computedCostUsd: computeHaikuCostUsd(inputTokens, outputTokens),
      },
    })
    .catch((err) => console.error("[ai-cost] failed to log QUICK_PRACTICE", { userId, err }));
}

export function logTranscribeCost(params: { userId: string; audioSeconds: number | null | undefined }): void {
  const { userId, audioSeconds } = params;
  db.aiCostLog
    .create({
      data: {
        userId,
        feature: "TRANSCRIBE",
        audioSeconds: audioSeconds ?? null,
        computedCostUsd: computeGroqWhisperCostUsd(audioSeconds),
      },
    })
    .catch((err) => console.error("[ai-cost] failed to log TRANSCRIBE", { userId, err }));
}
