import { db } from "@/lib/db";

function dateOnlyUTC(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// Pure streak transition: same calendar day (UTC) leaves it unchanged, the
// next calendar day increments it, anything older resets to 1.
export function computeNextStreak(
  lastSessionDate: Date | null,
  currentStreak: number,
  now: Date = new Date()
): number {
  if (!lastSessionDate) return 1;
  const dayDiff = Math.round((dateOnlyUTC(now) - dateOnlyUTC(lastSessionDate)) / 86_400_000);
  if (dayDiff <= 0) return currentStreak;
  if (dayDiff === 1) return currentStreak + 1;
  return 1;
}

// Call on completion of a scored practice answer. Fire-and-forget from callers.
export async function recordPracticeStreak(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, lastSessionDate: true },
  });
  if (!user) return;

  const currentStreak = computeNextStreak(user.lastSessionDate, user.currentStreak);
  await db.user.update({
    where: { id: userId },
    data: { currentStreak, lastSessionDate: new Date() },
  });
}
