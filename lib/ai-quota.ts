import { db } from "@/lib/db";

// Every limit below is a placeholder ceiling, not a deliberately chosen
// business number. The FREE limits mirror the pricing page's advertised
// caps; the "Pro" limits stand in for "unlimited" until real per-request
// cost data exists to pick a genuine number — revisit once that's available.
export const FREE_MONTHLY_EVALUATE_LIMIT = 3;   // matches pricing page's "3 AI mock interviews per month"
export const PRO_MONTHLY_EVALUATE_LIMIT = 300;  // placeholder generous ceiling for "Unlimited AI mock interviews"

// Interview with Hari (the conversational AI mentor persona) is a separate
// feature from graded Quick Practice
// answers, so it gets its own pool rather than sharing the evaluate quota.
export const FREE_MONTHLY_DEV_CHAT_LIMIT = 3;
export const PRO_MONTHLY_DEV_CHAT_LIMIT = 300;

export type QuotaResult = { allowed: boolean; limit: number; resetAt: Date };

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfNextMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function limitFor(plan: string, freeLimit: number, proLimit: number): number {
  return plan === "FREE" ? freeLimit : proLimit;
}

// Quick Practice already writes one InterviewSession row per graded answer
// (app/api/interview/evaluate/route.ts), so that's used directly as the
// usage ledger instead of duplicating it into a separate log.
export async function checkEvaluateQuota(userId: string, plan: string): Promise<QuotaResult> {
  const limit = limitFor(plan, FREE_MONTHLY_EVALUATE_LIMIT, PRO_MONTHLY_EVALUATE_LIMIT);
  const used = await db.interviewSession.count({
    where: { userId, createdAt: { gte: startOfCurrentMonth() } },
  });
  return { allowed: used < limit, limit, resetAt: startOfNextMonth() };
}

export async function checkDevChatQuota(userId: string, plan: string): Promise<QuotaResult> {
  const limit = limitFor(plan, FREE_MONTHLY_DEV_CHAT_LIMIT, PRO_MONTHLY_DEV_CHAT_LIMIT);
  const used = await db.aiUsage.count({
    where: { userId, kind: "DEV_CHAT", createdAt: { gte: startOfCurrentMonth() } },
  });
  return { allowed: used < limit, limit, resetAt: startOfNextMonth() };
}

// Records one unit of Dev-chat usage for the whole conversation — call this
// only when starting a new conversation, not on every message turn.
export async function recordDevChatUsage(userId: string): Promise<void> {
  try {
    await db.aiUsage.create({ data: { userId, kind: "DEV_CHAT" } });
  } catch {
    // best-effort usage log — a write failure shouldn't fail the chat request
  }
}

export function quotaErrorMessage(result: QuotaResult, plan: string, label: string): string {
  const resetLabel = result.resetAt.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return plan === "FREE"
    ? `You've used all ${result.limit} free ${label} this month — upgrade for more.`
    : `You've hit your monthly limit of ${result.limit} ${label} — resets on ${resetLabel}.`;
}
