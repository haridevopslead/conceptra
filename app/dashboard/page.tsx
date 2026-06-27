import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Count consecutive days (today or yesterday counts as streak-active)
function calcStreak(dates: Date[]): number {
  if (!dates.length) return 0;
  const days = new Set(dates.map((d) => d.toISOString().slice(0, 10)));
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (!days.has(todayStr) && !days.has(yesterdayStr)) return 0;

  let streak = 0;
  let cursor = days.has(todayStr) ? new Date() : new Date(Date.now() - 86_400_000);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

const QUICK_ACTIONS = [
  {
    href: "/interview",
    title: "Start Mock Interview",
    description: "Jump into an AI-powered session that simulates a real DevOps hiring panel.",
    cta: "Start Now",
    primary: true,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    href: "/lessons",
    title: "Browse Lessons",
    description: "Explore structured modules on Kubernetes, CI/CD, cloud platforms, and SRE.",
    cta: "Browse",
    primary: false,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
];

const TOPICS = [
  "Kubernetes & Container Orchestration",
  "CI/CD Pipelines",
  "AWS / GCP / Azure",
  "Infrastructure as Code",
  "Monitoring & Observability",
  "Site Reliability Engineering",
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user;
  const isFreePlan = !user.plan || user.plan === "FREE";

  // Fetch interview stats
  const interviews = await db.interviewSession.findMany({
    where: { userId: user.id },
    select: { score: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const interviewCount = interviews.length;
  const avgScore =
    interviewCount > 0
      ? Math.round(interviews.reduce((sum, s) => sum + s.score, 0) / interviewCount)
      : null;
  const streak = calcStreak(interviews.map((i) => i.createdAt));

  // Recent 5 for activity feed
  const recent = interviews.slice(0, 5);

  const STATS = [
    {
      label: "Lessons Completed",
      value: "0",
      sub: "Start your first lesson",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      label: "Mock Interviews",
      value: String(interviewCount),
      sub: interviewCount === 0 ? "Practice makes perfect" : `${interviewCount} session${interviewCount !== 1 ? "s" : ""} total`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      ),
    },
    {
      label: "Day Streak",
      value: streak > 0 ? `${streak}🔥` : "0",
      sub: streak > 0 ? "Keep it up!" : "Log in daily to build it",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
    {
      label: "Avg. Mock Score",
      value: avgScore !== null ? `${avgScore}/10` : "—",
      sub: avgScore !== null ? scoreLabel(avgScore) : "Complete an interview to score",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">{greeting()}</p>
          <h1 className="text-2xl font-bold text-white mt-0.5">
            {user.name ?? user.email}
          </h1>
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full mt-1 shrink-0"
          style={{
            backgroundColor: isFreePlan ? "#1F2937" : "#F5A623",
            color: isFreePlan ? "#9CA3AF" : "#0A0E1A",
            border: isFreePlan ? "1px solid rgba(255,255,255,0.1)" : "none",
          }}
        >
          {user.plan ?? "FREE"} PLAN
        </span>
      </div>

      {/* ── Upgrade banner (FREE only) ── */}
      {isFreePlan && (
        <div
          className="flex items-center justify-between gap-4 rounded-xl px-5 py-4 border"
          style={{ background: "rgba(245,166,35,0.07)", borderColor: "rgba(245,166,35,0.3)" }}
        >
          <div>
            <p className="text-sm font-semibold text-white">
              Unlock unlimited interviews &amp; all lessons
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Upgrade to Pro to get full AI coaching and priority feedback.
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#F5A623", color: "#0A0E1A" }}
          >
            Upgrade
          </Link>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5 border border-white/10 space-y-3"
            style={{ backgroundColor: "#111827" }}
          >
            <div className="text-gray-400">{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs font-medium text-gray-300 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Get Started
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {QUICK_ACTIONS.map((a) => (
            <div
              key={a.href}
              className="rounded-xl p-6 border border-white/10 flex flex-col gap-4"
              style={{ backgroundColor: "#111827" }}
            >
              <div style={{ color: "#F5A623" }}>{a.icon}</div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">{a.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{a.description}</p>
              </div>
              <Link
                href={a.href}
                className="self-start px-4 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
                style={
                  a.primary
                    ? { backgroundColor: "#F5A623", color: "#0A0E1A" }
                    : { backgroundColor: "transparent", color: "#F5A623", border: "1px solid #F5A623" }
                }
              >
                {a.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ── Topics covered ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Topics Covered
        </h2>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <span
              key={t}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 text-gray-300"
              style={{ backgroundColor: "#1F2937" }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── Recent activity ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Recent Activity
        </h2>
        {recent.length === 0 ? (
          <div
            className="rounded-xl border border-white/10 flex flex-col items-center justify-center py-14 text-center"
            style={{ backgroundColor: "#111827" }}
          >
            <svg className="w-10 h-10 text-gray-600 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <p className="text-sm font-medium text-gray-400">No activity yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Complete a lesson or interview to see your history here.
            </p>
            <Link href="/lessons" className="mt-4 text-xs font-semibold hover:underline" style={{ color: "#F5A623" }}>
              Start your first lesson →
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: "#111827" }}>
            {recent.map((s, i) => {
              const color = scoreColor(s.score);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}18` }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke={color} strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Mock Interview</p>
                      <p className="text-xs text-gray-500">{formatDate(s.createdAt)}</p>
                    </div>
                  </div>
                  <span
                    className="text-sm font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {s.score}/10
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function scoreColor(n: number) {
  if (n >= 8) return "#F5A623";
  if (n >= 6) return "#10B981";
  if (n >= 4) return "#F59E0B";
  return "#EF4444";
}

function scoreLabel(n: number) {
  if (n >= 8) return "Excellent";
  if (n >= 6) return "Good";
  if (n >= 4) return "Needs Work";
  return "Keep Practicing";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}
