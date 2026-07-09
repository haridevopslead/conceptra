// Tune the recency window here — how many of the user's most recent scored
// sessions feed the Readiness Score.
export const READINESS_WINDOW = 5;

const MIN_SESSIONS = 2;

export type SessionDimensions = {
  depthScore: number | null;
  accuracyScore: number | null;
  productionAwarenessScore: number | null;
};

export type ReadinessResult = {
  percent: number;
  avgDepth: number;
  avgAccuracy: number;
  avgProduction: number;
  sessionCount: number;
};

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// `sessions` must already be sorted most-recent-first (e.g. orderBy createdAt desc).
// Returns null when there isn't enough data yet for a meaningful score.
export function computeReadinessScore(
  sessions: SessionDimensions[],
  windowSize: number = READINESS_WINDOW
): ReadinessResult | null {
  const scored = sessions
    .filter(
      (s): s is { depthScore: number; accuracyScore: number; productionAwarenessScore: number } =>
        s.depthScore != null && s.accuracyScore != null && s.productionAwarenessScore != null
    )
    .slice(0, windowSize);

  if (scored.length < MIN_SESSIONS) return null;

  const avgDepth = avg(scored.map((s) => s.depthScore));
  const avgAccuracy = avg(scored.map((s) => s.accuracyScore));
  const avgProduction = avg(scored.map((s) => s.productionAwarenessScore));
  const percent = Math.round(((avgDepth + avgAccuracy + avgProduction) / 3 / 10) * 100);

  return { percent, avgDepth, avgAccuracy, avgProduction, sessionCount: scored.length };
}
