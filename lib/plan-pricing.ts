import type { PlanDuration } from "@/lib/generated/prisma/client";

// Single source of truth for what a plan duration costs and how long it
// lasts. create-order looks amounts up here rather than trusting anything
// the client sends, so a tampered request body can't buy Pro for less.
export const PLAN_DURATION_KEYS = ["monthly", "quarterly"] as const;
export type PlanDurationKey = (typeof PLAN_DURATION_KEYS)[number];

// "annual" was removed from purchasable options (users found a 12-month
// commitment too steep up front) — but PlanDuration.ANNUAL stays in the DB
// enum, since past purchasers still have it stored on their Payment rows and
// existing ANNUAL subscribers' access/expiry must keep working unchanged.
export const PLAN_PRICING: Record<
  PlanDurationKey,
  { amountPaise: number; days: number; label: string; dbDuration: PlanDuration }
> = {
  monthly: { amountPaise: 69_900, days: 30, label: "1 Month", dbDuration: "MONTHLY" },
  quarterly: { amountPaise: 149_900, days: 90, label: "3 Months", dbDuration: "QUARTERLY" },
};

export function isPlanDurationKey(value: unknown): value is PlanDurationKey {
  return typeof value === "string" && (PLAN_DURATION_KEYS as readonly string[]).includes(value);
}
