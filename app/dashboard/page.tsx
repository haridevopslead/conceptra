import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import WelcomeBanner from "@/components/dashboard/welcome-banner";
import VerifyEmailBanner from "@/components/dashboard/verify-email-banner";
import { computeReadinessScore, READINESS_WINDOW } from "@/lib/readiness";

const DAY_INITIAL = ["S", "M", "T", "W", "T", "F", "S"]; // indexed by getUTCDay() (0=Sun)

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getWeekDays(activityDates: Date[]) {
  const nowMs = Date.now();
  const todayStr = new Date(nowMs).toISOString().slice(0, 10);

  // Practiced dates as a Set of "YYYY-MM-DD" UTC strings — simple string comparison
  const practicedSet = new Set(
    activityDates.map((d) => new Date(d).toISOString().slice(0, 10))
  );

  // Rolling 7-day window: [6 days ago … today]
  // This ensures recent sessions are always visible regardless of which ISO weekday today is.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(nowMs - (6 - i) * 86_400_000);
    const dayStr = d.toISOString().slice(0, 10);
    return {
      label: DAY_INITIAL[d.getUTCDay()],
      active: practicedSet.has(dayStr),
      isToday: dayStr === todayStr,
    };
  });
}

function scoreColor(n: number) {
  if (n >= 8) return "#F5A623";
  if (n >= 6) return "#9CAE86";
  if (n >= 4) return "#D6A24E";
  return "#C57B6B";
}
function scoreLabel(n: number) {
  if (n >= 8) return "Excellent";
  if (n >= 6) return "Good";
  if (n >= 4) return "Needs Work";
  return "Keep Practicing";
}
function readinessColor(pct: number) {
  if (pct >= 80) return "#F5A623";
  if (pct >= 60) return "#9CAE86";
  if (pct >= 40) return "#D6A24E";
  return "#C57B6B";
}
function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user;

  let freshPlan = user.plan;
  let streak = 0;
  let emailVerified: Date | null = null;
  // Fetch fresh from DB rather than trusting the JWT — session.user.email
  // can be stale if the user just changed it via the verify-gate banner.
  let currentEmail = user.email;
  let interviews: {
    score: number;
    topic: string | null;
    createdAt: Date;
    depthScore: number | null;
    accuracyScore: number | null;
    productionAwarenessScore: number | null;
  }[] = [];
  let lessonProgress: { visitedAt: Date }[] = [];
  let totalLessons = 8;
  try {
    const [dbUser, dbInterviews, dbProgress, dbLessonCount] = await Promise.all([
      db.user.findUnique({ where: { id: user.id }, select: { plan: true, currentStreak: true, emailVerified: true, email: true } }),
      db.interviewSession.findMany({
        where: { userId: user.id },
        select: {
          score: true,
          topic: true,
          createdAt: true,
          depthScore: true,
          accuracyScore: true,
          productionAwarenessScore: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      db.userLessonProgress.findMany({
        where: { userId: user.id },
        select: { visitedAt: true },
      }),
      db.lesson.count({ where: { published: true } }),
    ]);
    if (dbUser) {
      freshPlan = dbUser.plan;
      streak = dbUser.currentStreak;
      emailVerified = dbUser.emailVerified;
      if (dbUser.email) currentEmail = dbUser.email;
    }
    interviews = dbInterviews;
    lessonProgress = dbProgress;
    totalLessons = dbLessonCount;
  } catch {
    // DB unavailable — show empty state
  }

  const isFreePlan = !freshPlan || freshPlan === "FREE";
  const lessonCount = lessonProgress.length;

  const interviewCount = interviews.length;
  const avgScore = interviewCount > 0
    ? Math.round(interviews.reduce((s, i) => s + i.score, 0) / interviewCount)
    : null;
  // `interviews` is already ordered most-recent-first, which is what the
  // readiness window needs.
  const readiness = computeReadinessScore(interviews, READINESS_WINDOW);
  // Wrap with new Date() defensively — Prisma always returns Date objects from
  // Railway PostgreSQL, but the explicit wrap guards against any serialization edge case.
  const allActivityDates = [
    ...interviews.map((i) => new Date(i.createdAt)),
    ...lessonProgress.map((l) => new Date(l.visitedAt)),
  ];

  // Debug: visible in Railway deployment logs
  console.log("sessions:", JSON.stringify(interviews));
  const practicedDates = allActivityDates.map((d) => new Date(d).toISOString().slice(0, 10));
  console.log("practicedDates:", JSON.stringify(practicedDates));
  console.log("weekDays:", JSON.stringify(getWeekDays(allActivityDates).map((d) => `${d.label}:active=${d.active}:today=${d.isToday}`)));

  const weekDays = getWeekDays(allActivityDates);
  const recent = interviews.slice(0, 3);
  const trackPct = Math.min(100, Math.round((lessonCount / totalLessons) * 100));
  const dayLabel = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const isFirstTimeUser = interviewCount === 0 && lessonCount === 0;

  return (
    <div className="dash-page" style={{ maxWidth: 920, margin: "0 auto", padding: "56px 64px 80px", display: "flex", flexDirection: "column", gap: 26 }}>

      {isFirstTimeUser && <WelcomeBanner />}
      {!emailVerified && currentEmail && <VerifyEmailBanner email={currentEmail} />}

      {/* Header */}
      <div className="dash-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div>
          <p style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, marginBottom: 10 }}>
            {dayLabel}{streak > 0 ? ` · 🔥 ${streak}-day streak` : ""}
          </p>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 40, fontWeight: 500, color: "var(--foreground)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
            {greeting()}, {user.name ?? user.email?.split("@")[0]}.
          </h1>
          <p style={{ fontSize: 17, color: "var(--muted)", marginTop: 8 }}>
            {streak > 0 ? "Ready for today's practice? You're building real momentum." : "Start your first session to begin building momentum."}
          </p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", padding: "5px 11px", borderRadius: 999, background: isFreePlan ? "var(--surface-2)" : "var(--accent)", color: isFreePlan ? "var(--muted)" : "var(--accent-contrast)", border: isFreePlan ? "1px solid var(--border)" : "none", marginTop: 6, flexShrink: 0 }}>
          {freshPlan ?? "FREE"} PLAN
        </span>
      </div>

      {/* Upgrade banner */}
      {isFreePlan && (
        <div className="dash-upgrade-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.28)", borderRadius: 16, padding: "20px 24px" }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>Unlock every interview brief and unlimited mock interviews</p>
            <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 3 }}>Go Pro for full AI coaching and priority feedback.</p>
          </div>
          <Link href="/pricing" style={{ flexShrink: 0, background: "var(--accent)", color: "var(--accent-contrast)", fontWeight: 600, fontSize: 14, border: "none", padding: "11px 20px", borderRadius: 10, cursor: "pointer", textDecoration: "none" }}>
            Upgrade
          </Link>
        </div>
      )}

      {/* Readiness Score — the primary number a returning user sees */}
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 20, padding: "30px 32px" }}>
        {readiness ? (
          <>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 500, color: "var(--foreground)", lineHeight: 1.25 }}>
              You&rsquo;re <span style={{ color: readinessColor(readiness.percent), fontWeight: 700 }}>{readiness.percent}%</span> interview-ready.
            </p>
            <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 8 }}>
              Based on your last {readiness.sessionCount} scored session{readiness.sessionCount === 1 ? "" : "s"}
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
              {[
                { label: "Depth", val: readiness.avgDepth },
                { label: "Accuracy", val: readiness.avgAccuracy },
                { label: "Production Awareness", val: readiness.avgProduction },
              ].map((d) => (
                <div key={d.label} style={{ flex: "1 1 140px", background: "var(--background)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: scoreColor(Math.round(d.val)) }}>
                    {d.val.toFixed(1)}<span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>/10</span>
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{d.label}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "14px 0" }}>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 22, color: "var(--foreground)" }}>Keep practicing to unlock your Readiness Score.</p>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>Complete at least 2 mock interviews and we&rsquo;ll show how interview-ready you are.</p>
          </div>
        )}
      </div>

      {/* Streak tracker */}
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 20, padding: "30px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36, flexWrap: "wrap" }}>
        <div className="dash-streak-inner" style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 64, fontWeight: 600, color: "var(--accent-text)", lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500, marginTop: 4 }}>day streak</span>
          </div>
          <div className="dash-streak-divider" style={{ width: 1, height: 54, background: "var(--border)" }} />
          <div style={{ maxWidth: 220 }}>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 19, color: "var(--foreground)", lineHeight: 1.3 }}>
              {streak > 0 ? "You're showing up." : "Start your first session."}
            </p>
            <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>
              {streak > 0 ? "Practice daily and this becomes a habit, not a chore." : "Complete a mock interview to begin your streak."}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>
            Last 7 days
          </span>
          <div style={{ display: "flex", gap: 12 }}>
            {weekDays.map((d, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
                <div
                  className={d.active && d.isToday ? "streak-dot-today" : ""}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: d.active ? "var(--accent)" : "transparent",
                    border: d.active
                      ? "none"
                      : d.isToday
                      ? "1.5px solid rgba(245,166,35,0.5)"
                      : "1.5px solid var(--border)",
                  }}
                />
                <span style={{ fontSize: 12, color: d.isToday ? "var(--accent-text)" : "var(--muted)", fontWeight: d.isToday ? 700 : 600 }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's focus */}
      <div className="dash-focus-inner" style={{ background: "var(--surface-2)", border: "1px solid rgba(245,166,35,0.22)", borderLeft: "3px solid var(--accent)", borderRadius: 18, padding: "26px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
            <p style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--accent-text)", fontWeight: 600, margin: 0 }}>Today&rsquo;s focus</p>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(245,166,35,0.14)", color: "var(--accent-text)" }}>~15 min</span>
          </div>
          <p style={{ fontFamily: "'Newsreader', serif", fontSize: 20, color: "var(--foreground)", lineHeight: 1.35, marginBottom: 6 }}>
            {interviewCount === 0 ? "Run your first mock interview." : "Sharpen your production awareness."}
          </p>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55 }}>
            {interviewCount === 0
              ? "Pick a topic — Kubernetes, Docker, or CI/CD — and get honest feedback the way a senior engineer would give it."
              : "Focus on failure modes — what breaks at 2am, and how you'd catch it. That's what separates a good answer from a great one."}
          </p>
        </div>
        <Link href="/interview" style={{ flexShrink: 0, background: "var(--accent)", color: "var(--accent-contrast)", fontWeight: 600, fontSize: 14, border: "none", padding: "12px 22px", borderRadius: 11, cursor: "pointer", textDecoration: "none" }}>
          Practice now →
        </Link>
      </div>

      {/* Quick actions */}
      <div className="dash-quick-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Link href="/interview" className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg" style={{ textDecoration: "none", textAlign: "left", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, padding: 28, cursor: "pointer", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ color: "var(--accent-text)" }}>
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 20, color: "var(--foreground)", fontWeight: 500 }}>Start today&rsquo;s mock interview</p>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 5, lineHeight: 1.5 }}>Seven questions, honest feedback, the way a senior would give it.</p>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-text)", marginTop: 2 }}>Begin session →</span>
        </Link>
        <Link href="/lessons" className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg" style={{ textDecoration: "none", textAlign: "left", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, padding: 28, cursor: "pointer", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ color: "var(--accent-text)" }}>
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 20, color: "var(--foreground)", fontWeight: 500 }}>Continue learning</p>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 5, lineHeight: 1.5 }}>Pick up where you left off across {totalLessons} interview briefs.</p>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-text)", marginTop: 2 }}>Browse interview briefs →</span>
        </Link>
      </div>

      {/* Journey */}
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 20, padding: "30px 32px" }}>
        <p style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, marginBottom: 22 }}>Your journey so far</p>
        <div className="dash-journey-stats" style={{ display: "flex", gap: 48, flexWrap: "wrap", marginBottom: 26 }}>
          <div>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 38, fontWeight: 500, color: "var(--foreground)", lineHeight: 1 }}>{lessonCount}</p>
            <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 6 }}>Briefs completed</p>
          </div>
          <div>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 38, fontWeight: 500, color: "var(--foreground)", lineHeight: 1 }}>{interviewCount}</p>
            <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 6 }}>Mock interviews</p>
          </div>
          {avgScore !== null && (
            <div>
              <p style={{ fontFamily: "'Newsreader', serif", fontSize: 38, fontWeight: 500, color: "var(--accent-text)", lineHeight: 1 }}>
                {avgScore}<span style={{ fontSize: 18, color: "var(--accent-text)" }}>/10</span>
              </p>
              <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 6 }}>Average mock score</p>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
          <span style={{ fontSize: 13.5, color: "var(--muted)" }}>DevOps track progress</span>
          <span style={{ fontSize: 13.5, color: "var(--muted)" }}>{trackPct}%</span>
        </div>
        <div style={{ height: 8, background: "var(--background)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${trackPct}%`, height: "100%", background: "var(--accent)", borderRadius: 999 }} />
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <p style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, marginBottom: 14 }}>Recent activity</p>
        {recent.length === 0 ? (
          <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, padding: "54px 30px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 21, color: "var(--foreground)" }}>Nothing here — yet.</p>
            <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 340, lineHeight: 1.55 }}>Complete a brief or interview to see your history here.</p>
            <Link href="/lessons" style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600, color: "var(--accent-text)", textDecoration: "none" }}>Start your first brief →</Link>
          </div>
        ) : (
          <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
            {recent.map((s, i) => {
              const color = scoreColor(s.score);
              return (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 24px", borderBottom: i < recent.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, color: "var(--foreground)", fontWeight: 500 }}>Mock Interview{s.topic ? ` · ${s.topic}` : ""}</p>
                    <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{scoreLabel(s.score)} · {formatDate(s.createdAt)}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: `${color}20`, color, flexShrink: 0 }}>
                    {s.score}/10
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {recent.length > 0 && (
          <p style={{ display: "inline-block", marginTop: 12, fontSize: 13.5, fontWeight: 600, color: "var(--muted)" }}>
            View all activity <span style={{ fontWeight: 500 }}>(coming soon)</span>
          </p>
        )}
      </div>
    </div>
  );
}
