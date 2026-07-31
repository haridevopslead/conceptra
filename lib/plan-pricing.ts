import type { PlanDuration } from "@/lib/generated/prisma/client";

// Single source of truth for what a plan duration costs and how long it
// lasts. create-order looks amounts up here rather than trusting anything
// the client sends, so a tampered request body can't buy Pro for less.
export const PLAN_DURATION_KEYS = ["monthly", "quarterly", "annual"] as const;
export type PlanDurationKey = (typeof PLAN_DURATION_KEYS)[number];

export const PLAN_PRICING: Record<
  PlanDurationKey,
  { amountPaise: number; days: number; label: string; dbDuration: PlanDuration }
> = {
  monthly: { amountPaise: 69_900, days: 30, label: "1 Month", dbDuration: "MONTHLY" },
  quarterly: { amountPaise: 200_000, days: 90, label: "3 Months", dbDuration: "QUARTERLY" },
  annual: { amountPaise: 299_900, days: 365, label: "12 Months", dbDuration: "ANNUAL" },
};

export function isPlanDurationKey(value: unknown): value is PlanDurationKey {
  return typeof value === "string" && (PLAN_DURATION_KEYS as readonly string[]).includes(value);
}
