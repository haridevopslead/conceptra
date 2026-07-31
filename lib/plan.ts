import { db } from "@/lib/db";

// Every plan-gated call site in the app used to trust the raw `plan` column,
// which stays "PRO" forever once set (see prisma/schema.prisma's Payment
// model + lib/apply-pro-upgrade.ts for how planExpiresAt gets set). A daily
// cron (app/api/cron/downgrade-expired-plans/route.ts) eventually flips
// lapsed users back to "FREE" in the DB, but access must be denied the
// instant a plan lapses, not just after that job next runs — so every read
// path should call this instead of reading `plan` directly.
//
// ENTERPRISE isn't sold through this payment flow and never gets a
// planExpiresAt, so it's treated as never-expiring here.
export function effectivePlan(plan: string, planExpiresAt: Date | null): string {
  if (plan === "PRO" && planExpiresAt && planExpiresAt.getTime() <= Date.now()) {
    return "FREE";
  }
  return plan;
}

export async function getEffectivePlan(userId: string): Promise<{ plan: string; planExpiresAt: Date | null }> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true, planExpiresAt: true } });
  if (!user) return { plan: "FREE", planExpiresAt: null };
  return { plan: effectivePlan(user.plan, user.planExpiresAt), planExpiresAt: user.planExpiresAt };
}
