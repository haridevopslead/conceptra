import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "AI Cost Report — Conceptra" };

// Founder-only internal report — real measured AiCostLog data (see
// lib/ai-cost.ts / lib/ai-pricing.ts), not estimated cost. Pricing/margin
// decisions (plan pricing, whether to add TTS) should be made against these
// numbers instead of hand-calculated guesses.

const FEATURE_LABELS: Record<string, string> = {
  HARI_CHAT: "Hari Chat",
  QUICK_PRACTICE: "Quick Practice",
  TRANSCRIBE: "Transcribe",
};

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function formatUsd(n: number): string {
  return `$${n.toFixed(n < 1 ? 4 : 2)}`;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(d);
}

type FeatureRow = { feature: string; calls: number; cost: number };
type PlanRow = { plan: string; users: number; cost: number; avgPerUser: number };

type CostData = {
  since: Date;
  totalCost: number;
  totalCalls: number;
  distinctUsers: number;
  avgCostPerUser: number;
  byFeature: FeatureRow[];
  byPlan: PlanRow[];
};

async function loadCostData(): Promise<CostData> {
  const since = startOfCurrentMonth();
  const logs = await db.aiCostLog.findMany({
    where: { createdAt: { gte: since } },
    select: { feature: true, computedCostUsd: true, userId: true, user: { select: { plan: true } } },
  });

  const byFeature = new Map<string, { calls: number; cost: number }>();
  const byPlan = new Map<string, { cost: number; users: Set<string> }>();
  let totalCost = 0;

  for (const log of logs) {
    const cost = log.computedCostUsd.toNumber();
    totalCost += cost;

    const featureEntry = byFeature.get(log.feature) ?? { calls: 0, cost: 0 };
    featureEntry.calls += 1;
    featureEntry.cost += cost;
    byFeature.set(log.feature, featureEntry);

    const planEntry = byPlan.get(log.user.plan) ?? { cost: 0, users: new Set<string>() };
    planEntry.cost += cost;
    planEntry.users.add(log.userId);
    byPlan.set(log.user.plan, planEntry);
  }

  const distinctUsers = new Set(logs.map((l) => l.userId)).size;

  return {
    since,
    totalCost,
    totalCalls: logs.length,
    distinctUsers,
    avgCostPerUser: distinctUsers > 0 ? totalCost / distinctUsers : 0,
    byFeature: Array.from(byFeature.entries())
      .map(([feature, v]) => ({ feature, ...v }))
      .sort((a, b) => b.cost - a.cost),
    byPlan: Array.from(byPlan.entries())
      .map(([plan, v]) => ({ plan, cost: v.cost, users: v.users.size, avgPerUser: v.cost / v.users.size }))
      .sort((a, b) => b.cost - a.cost),
  };
}

export default async function AiCostReportPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  let data: CostData | null = null;
  try {
    data = await loadCostData();
  } catch {
    data = null;
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "56px 64px 80px", display: "flex", flexDirection: "column", gap: 26 }}>
      <div>
        <p style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, marginBottom: 10 }}>
          Internal — Admin Only
        </p>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
          AI Cost Report
        </h1>
        <p style={{ fontSize: 15, color: "var(--muted)", marginTop: 8, maxWidth: 560, lineHeight: 1.55 }}>
          Real measured AI provider cost, since {data ? formatDate(data.since) : "the start of this month"}. Not an estimate.
        </p>
      </div>

      {!data ? (
        <p style={{ color: "var(--muted)" }}>Could not load cost data.</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <SummaryCard label="Total cost this month" value={formatUsd(data.totalCost)} />
            <SummaryCard label="AI calls this month" value={String(data.totalCalls)} />
            <SummaryCard label="Users with AI usage" value={String(data.distinctUsers)} />
            <SummaryCard label="Avg cost / user" value={formatUsd(data.avgCostPerUser)} />
          </div>

          <Section title="Cost by feature">
            <Table
              columns={["Feature", "Calls", "Total cost", "Avg / call"]}
              rows={data.byFeature.map((r) => [
                FEATURE_LABELS[r.feature] ?? r.feature,
                String(r.calls),
                formatUsd(r.cost),
                formatUsd(r.cost / r.calls),
              ])}
              emptyMessage="No AI usage logged yet this month."
            />
          </Section>

          <Section title="Cost per user by plan tier">
            <Table
              columns={["Plan", "Users", "Total cost", "Avg cost / user"]}
              rows={data.byPlan.map((r) => [r.plan, String(r.users), formatUsd(r.cost), formatUsd(r.avgPerUser)])}
              emptyMessage="No AI usage logged yet this month."
            />
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
              Avg cost / user here is real margin input — compare against each plan&apos;s price to see actual AI cost as a
              share of revenue per user, instead of the worst-case estimate.
            </p>
          </Section>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: "1 1 160px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
      <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ fontFamily: "'Newsreader', serif", fontSize: 26, color: "var(--foreground)", marginTop: 6 }}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, padding: "24px 26px" }}>
      <p style={{ fontFamily: "'Newsreader', serif", fontSize: 20, color: "var(--foreground)", fontWeight: 500, marginBottom: 16 }}>{title}</p>
      {children}
    </div>
  );
}

function Table({ columns, rows, emptyMessage }: { columns: string[]; rows: string[][]; emptyMessage: string }) {
  if (rows.length === 0) {
    return <p style={{ fontSize: 13.5, color: "var(--muted)" }}>{emptyMessage}</p>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--muted)",
                  fontWeight: 600,
                  fontSize: 12.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 10px",
                    borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                    color: "var(--foreground)",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
