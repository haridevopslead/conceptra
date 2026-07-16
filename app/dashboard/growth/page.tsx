import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Your Growth — Conceptra" };

// ── Data shaping ─────────────────────────────────────────────────────────────
// Reads piece 1's HariSessionLog and piece 2's HariWeakArea — both already
// written by app/api/interview/dev/route.ts — and aggregates them here at
// read time (piece 2 deliberately doesn't dedupe at write time).

type ConceptStat = {
  concept: string;
  count: number;
  firstFlaggedAt: Date;
  lastFlaggedAt: Date;
  // Sessions on this topic that happened after this concept was last
  // flagged — a real, verifiable count (not a fabricated "% improved"),
  // used only as a gentle "hasn't come up recently" signal.
  sessionsSinceLastFlagged: number;
};

type TopicGroup = {
  topic: string;
  sessionCount: number;
  concepts: ConceptStat[];
  mostRecentActivity: Date;
};

function maxDate(dates: Date[]): Date {
  return dates.reduce((max, d) => (d > max ? d : max), new Date(0));
}

async function loadGrowthData(userId: string): Promise<{ groups: TopicGroup[]; totalSessions: number }> {
  const [weakAreas, sessionLogs] = await Promise.all([
    db.hariWeakArea.findMany({
      where: { userId },
      select: { topic: true, concept: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.hariSessionLog.findMany({
      where: { userId },
      select: { topic: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const sessionsByTopic = new Map<string, Date[]>();
  for (const s of sessionLogs) {
    const arr = sessionsByTopic.get(s.topic) ?? [];
    arr.push(s.createdAt);
    sessionsByTopic.set(s.topic, arr);
  }

  const conceptsByTopic = new Map<string, Map<string, { count: number; first: Date; last: Date }>>();
  for (const w of weakAreas) {
    const topicMap = conceptsByTopic.get(w.topic) ?? new Map();
    const existing = topicMap.get(w.concept);
    if (existing) {
      existing.count += 1;
      if (w.createdAt < existing.first) existing.first = w.createdAt;
      if (w.createdAt > existing.last) existing.last = w.createdAt;
    } else {
      topicMap.set(w.concept, { count: 1, first: w.createdAt, last: w.createdAt });
    }
    conceptsByTopic.set(w.topic, topicMap);
  }

  const allTopics = new Set([...Array.from(sessionsByTopic.keys()), ...Array.from(conceptsByTopic.keys())]);

  const groups: TopicGroup[] = Array.from(allTopics).map((topic) => {
    const sessions = sessionsByTopic.get(topic) ?? [];
    const conceptMap = conceptsByTopic.get(topic) ?? new Map();
    const concepts: ConceptStat[] = Array.from(conceptMap.entries())
      .map(([concept, stat]) => ({
        concept,
        count: stat.count,
        firstFlaggedAt: stat.first,
        lastFlaggedAt: stat.last,
        sessionsSinceLastFlagged: sessions.filter((d) => d > stat.last).length,
      }))
      .sort((a, b) => b.count - a.count || b.lastFlaggedAt.getTime() - a.lastFlaggedAt.getTime());

    return {
      topic,
      sessionCount: sessions.length,
      concepts,
      mostRecentActivity: maxDate([...sessions, ...concepts.map((c) => c.lastFlaggedAt)]),
    };
  });

  groups.sort((a, b) => b.mostRecentActivity.getTime() - a.mostRecentActivity.getTime());

  return { groups, totalSessions: sessionLogs.length };
}

// ── Presentation helpers ─────────────────────────────────────────────────────

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function frequencyColor(count: number) {
  if (count >= 3) return "#C57B6B";
  if (count === 2) return "#D6A24E";
  return "var(--muted)";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function GrowthPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let plan = session.user.plan;
  try {
    const dbUser = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
    if (dbUser) plan = dbUser.plan;
  } catch {
    // fall back to JWT plan
  }
  const hasAccess = plan !== "FREE";

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "56px 64px 80px", display: "flex", flexDirection: "column", gap: 26 }}>
      <div>
        <p style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, marginBottom: 10 }}>
          Interview with Hari
        </p>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "var(--foreground)", letterSpacing: "-0.01em" }}>
          Your Growth
        </h1>
        <p style={{ fontSize: 15, color: "var(--muted)", marginTop: 8, maxWidth: 560, lineHeight: 1.55 }}>
          What Hari has noticed across your sessions — grouped by topic, most persistent patterns first.
        </p>
      </div>

      {hasAccess ? <GrowthContent userId={session.user.id} /> : <LockedPreview />}
    </div>
  );
}

// ── Pro: real content ────────────────────────────────────────────────────────

async function GrowthContent({ userId }: { userId: string }) {
  let groups: TopicGroup[] = [];
  let totalSessions = 0;
  try {
    const data = await loadGrowthData(userId);
    groups = data.groups;
    totalSessions = data.totalSessions;
  } catch {
    // DB unavailable — show empty state rather than a broken page
  }

  if (groups.length === 0) {
    return (
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, padding: "54px 30px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <p style={{ fontFamily: "'Newsreader', serif", fontSize: 21, color: "var(--foreground)" }}>Nothing here — yet.</p>
        <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 380, lineHeight: 1.55 }}>
          Complete a few Hari sessions to start building your growth profile.
        </p>
        <Link href="/interview/dev" style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600, color: "var(--accent-text)", textDecoration: "none" }}>
          Start a session with Hari →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
        {totalSessions} Hari session{totalSessions === 1 ? "" : "s"} across {groups.length} topic{groups.length === 1 ? "" : "s"}.
      </p>

      {groups.map((g) => (
        <div key={g.topic} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, padding: "26px 28px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: g.concepts.length ? 18 : 0 }}>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 21, color: "var(--foreground)", fontWeight: 500 }}>{g.topic}</p>
            <span style={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}>
              {g.sessionCount} session{g.sessionCount === 1 ? "" : "s"}
            </span>
          </div>

          {g.concepts.length === 0 ? (
            <p style={{ fontSize: 13.5, color: "var(--muted)" }}>No specific weak areas flagged on this topic yet — nice work.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {g.concepts.map((c, i) => (
                <div
                  key={c.concept}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 4px",
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0, marginTop: 3, fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
                      color: c.count === 1 ? "var(--muted)" : "#1C1917",
                      background: c.count === 1 ? "var(--background)" : frequencyColor(c.count),
                      border: c.count === 1 ? "1px solid var(--border)" : "none",
                      minWidth: 58, textAlign: "center",
                    }}
                  >
                    {c.count === 1 ? "1×" : `${c.count}×`}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, color: "var(--foreground)", fontWeight: 500 }}>{c.concept}</p>
                    <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
                      {c.count === 1
                        ? `Flagged once, on ${formatDate(c.firstFlaggedAt)}`
                        : `Flagged ${c.count} times · first ${formatDate(c.firstFlaggedAt)}, most recently ${formatDate(c.lastFlaggedAt)}`}
                    </p>
                    {c.sessionsSinceLastFlagged > 0 && (
                      <p style={{ fontSize: 12.5, color: "#9CAE86", marginTop: 4, fontWeight: 500 }}>
                        Not flagged in your last {c.sessionsSinceLastFlagged === 1 ? "session" : `${c.sessionsSinceLastFlagged} sessions`} on {g.topic}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Free: locked preview ─────────────────────────────────────────────────────
// A static, clearly-illustrative mockup (not real data) — blurred, with an
// upgrade CTA on top. Free users never get weak-area extraction (piece 2 is
// PRO-only), so there's nothing real to show even for a downgraded account;
// this exists purely to make the value visible and drive the upsell.

const SAMPLE_TOPICS: TopicGroup[] = [
  {
    topic: "Kubernetes",
    sessionCount: 4,
    mostRecentActivity: new Date(),
    concepts: [
      { concept: "CrashLoopBackOff root cause analysis", count: 3, firstFlaggedAt: new Date(), lastFlaggedAt: new Date(), sessionsSinceLastFlagged: 0 },
      { concept: "Readiness vs liveness probe configuration", count: 2, firstFlaggedAt: new Date(), lastFlaggedAt: new Date(), sessionsSinceLastFlagged: 1 },
    ],
  },
  {
    topic: "Docker",
    sessionCount: 2,
    mostRecentActivity: new Date(),
    concepts: [
      { concept: "Layer caching and COPY ordering", count: 2, firstFlaggedAt: new Date(), lastFlaggedAt: new Date(), sessionsSinceLastFlagged: 0 },
    ],
  },
];

function LockedPreview() {
  return (
    <div style={{ position: "relative" }}>
      <div
        aria-hidden="true"
        style={{ filter: "blur(5px)", opacity: 0.6, pointerEvents: "none", userSelect: "none", display: "flex", flexDirection: "column", gap: 18 }}
      >
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>6 Hari sessions across 2 topics.</p>
        {SAMPLE_TOPICS.map((g) => (
          <div key={g.topic} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, padding: "26px 28px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
              <p style={{ fontFamily: "'Newsreader', serif", fontSize: 21, color: "var(--foreground)", fontWeight: 500 }}>{g.topic}</p>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{g.sessionCount} sessions</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {g.concepts.map((c, i) => (
                <div key={c.concept} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 4px", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ flexShrink: 0, marginTop: 3, fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 999, color: "#1C1917", background: frequencyColor(c.count), minWidth: 58, textAlign: "center" }}>
                    {c.count}×
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, color: "var(--foreground)", fontWeight: 500 }}>{c.concept}</p>
                    <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>Flagged {c.count} times · most recently {formatDate(c.lastFlaggedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "32px 34px", textAlign: "center", maxWidth: 360, boxShadow: "0 12px 40px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(245,166,35,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" fill="none" stroke="var(--accent-text)" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
          <p style={{ fontFamily: "'Newsreader', serif", fontSize: 20, color: "var(--foreground)", fontWeight: 500 }}>
            Your Growth is a Pro feature
          </p>
          <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>
            Pro remembers every concept you've struggled with across sessions and shows you exactly what keeps coming up — so you know precisely what to work on next.
          </p>
          <Link
            href="/pricing"
            style={{ marginTop: 6, background: "var(--accent)", color: "var(--accent-contrast)", fontWeight: 600, fontSize: 14, border: "none", padding: "11px 22px", borderRadius: 10, textDecoration: "none" }}
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
