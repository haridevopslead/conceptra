import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

const TOTAL_LESSONS = 12;
const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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

function getWeekDays(interviewDates: Date[]) {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  const activeDates = new Set(interviewDates.map((d) => d.toISOString().slice(0, 10)));
  return WEEK_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, active: activeDates.has(d.toISOString().slice(0, 10)) };
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
function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user;
  const isFreePlan = !user.plan || user.plan === "FREE";

  const interviews = await db.interviewSession.findMany({
    where: { userId: user.id },
    select: { score: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const lessonCount = await db.userLessonProgress.count({ where: { userId: user.id } });

  const interviewCount = interviews.length;
  const avgScore = interviewCount > 0
    ? Math.round(interviews.reduce((s, i) => s + i.score, 0) / interviewCount)
    : null;
  const streak = calcStreak(interviews.map((i) => i.createdAt));
  const weekDays = getWeekDays(interviews.map((i) => i.createdAt));
  const recent = interviews.slice(0, 3);
  const trackPct = Math.min(100, Math.round((lessonCount / TOTAL_LESSONS) * 100));
  const dayLabel = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="dash-page" style={{ maxWidth: 920, margin: "0 auto", padding: "56px 64px 80px", display: "flex", flexDirection: "column", gap: 26 }}>

      {/* Header */}
      <div className="dash-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div>
          <p style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8A8073", fontWeight: 600, marginBottom: 10 }}>
            {dayLabel}{streak > 0 ? ` · Day ${streak} of your streak` : ""}
          </p>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 40, fontWeight: 500, color: "#FDF6E3", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
            {greeting()}, {user.name ?? user.email?.split("@")[0]}.
          </h1>
          <p style={{ fontSize: 17, color: "#C9BFB2", marginTop: 8 }}>
            {streak > 0 ? "Ready for today's practice? You're building real momentum." : "Start your first session to begin building momentum."}
          </p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", padding: "5px 11px", borderRadius: 999, background: isFreePlan ? "#2C2420" : "#F5A623", color: isFreePlan ? "#B3A799" : "#1C1917", border: isFreePlan ? "1px solid rgba(253,246,227,0.08)" : "none", marginTop: 6, flexShrink: 0 }}>
          {user.plan ?? "FREE"} PLAN
        </span>
      </div>

      {/* Upgrade banner */}
      {isFreePlan && (
        <div className="dash-upgrade-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.28)", borderRadius: 16, padding: "20px 24px" }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#FDF6E3" }}>Unlock every lesson and unlimited mock interviews</p>
            <p style={{ fontSize: 13.5, color: "#B3A799", marginTop: 3 }}>Go Pro for full AI coaching and priority feedback.</p>
          </div>
          <Link href="/pricing" style={{ flexShrink: 0, background: "#F5A623", color: "#1C1917", fontWeight: 600, fontSize: 14, border: "none", padding: "11px 20px", borderRadius: 10, cursor: "pointer", textDecoration: "none" }}>
            Upgrade
          </Link>
        </div>
      )}

      {/* Streak tracker */}
      <div style={{ background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 20, padding: "30px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36, flexWrap: "wrap" }}>
        <div className="dash-streak-inner" style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 64, fontWeight: 600, color: "#F5A623", lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: 16, color: "#B3A799", fontWeight: 500, lineHeight: 1.2 }}>day<br />streak</span>
          </div>
          <div style={{ width: 1, height: 54, background: "rgba(253,246,227,0.1)" }} />
          <div style={{ maxWidth: 220 }}>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 19, color: "#FDF6E3", lineHeight: 1.3 }}>
              {streak > 0 ? "You're showing up." : "Start your first session."}
            </p>
            <p style={{ fontSize: 13.5, color: "#8A8073", marginTop: 4, lineHeight: 1.4 }}>
              {streak > 0 ? "Practice daily and this becomes a habit, not a chore." : "Complete a mock interview to begin your streak."}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {weekDays.map((d, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: d.active ? "#F5A623" : "transparent", border: d.active ? "none" : "1.5px solid rgba(253,246,227,0.15)" }} />
              <span style={{ fontSize: 12, color: "#8A8073", fontWeight: 600 }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's focus */}
      <div className="dash-focus-inner" style={{ background: "#2C2420", border: "1px solid rgba(245,166,35,0.22)", borderLeft: "3px solid #F5A623", borderRadius: 18, padding: "26px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 560 }}>
          <p style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#F5A623", fontWeight: 600, marginBottom: 9 }}>Today&rsquo;s focus</p>
          <p style={{ fontFamily: "'Newsreader', serif", fontSize: 20, color: "#FDF6E3", lineHeight: 1.35, marginBottom: 6 }}>
            {interviewCount === 0 ? "Run your first mock interview." : "Sharpen your production awareness."}
          </p>
          <p style={{ fontSize: 14, color: "#B3A799", lineHeight: 1.55 }}>
            {interviewCount === 0
              ? "Pick a topic — Kubernetes, Docker, or CI/CD — and get honest feedback the way a senior engineer would give it."
              : "Focus on failure modes — what breaks at 2am, and how you'd catch it. That's what separates a good answer from a great one."}
          </p>
        </div>
        <Link href="/interview" style={{ flexShrink: 0, background: "#F5A623", color: "#1C1917", fontWeight: 600, fontSize: 14, border: "none", padding: "12px 22px", borderRadius: 11, cursor: "pointer", textDecoration: "none" }}>
          Practice now →
        </Link>
      </div>

      {/* Quick actions */}
      <div className="dash-quick-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Link href="/interview" style={{ textDecoration: "none", textAlign: "left", background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 18, padding: 28, cursor: "pointer", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ color: "#F5A623" }}>
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 20, color: "#FDF6E3", fontWeight: 500 }}>Start today&rsquo;s mock interview</p>
            <p style={{ fontSize: 14, color: "#B3A799", marginTop: 5, lineHeight: 1.5 }}>Seven questions, honest feedback, the way a senior would give it.</p>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#F5A623", marginTop: 2 }}>Begin session →</span>
        </Link>
        <Link href="/lessons" style={{ textDecoration: "none", textAlign: "left", background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 18, padding: 28, cursor: "pointer", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ color: "#F5A623" }}>
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 20, color: "#FDF6E3", fontWeight: 500 }}>Continue learning</p>
            <p style={{ fontSize: 14, color: "#B3A799", marginTop: 5, lineHeight: 1.5 }}>Pick up where you left off across {TOTAL_LESSONS} DevOps lessons.</p>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#F5A623", marginTop: 2 }}>Browse lessons →</span>
        </Link>
      </div>

      {/* Journey */}
      <div style={{ background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 20, padding: "30px 32px" }}>
        <p style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8073", fontWeight: 600, marginBottom: 22 }}>Your journey so far</p>
        <div className="dash-journey-stats" style={{ display: "flex", gap: 48, flexWrap: "wrap", marginBottom: 26 }}>
          <div>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 38, fontWeight: 500, color: "#FDF6E3", lineHeight: 1 }}>{lessonCount}</p>
            <p style={{ fontSize: 13.5, color: "#8A8073", marginTop: 6 }}>Lessons completed</p>
          </div>
          <div>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 38, fontWeight: 500, color: "#FDF6E3", lineHeight: 1 }}>{interviewCount}</p>
            <p style={{ fontSize: 13.5, color: "#8A8073", marginTop: 6 }}>Mock interviews</p>
          </div>
          {avgScore !== null && (
            <div>
              <p style={{ fontFamily: "'Newsreader', serif", fontSize: 38, fontWeight: 500, color: scoreColor(avgScore), lineHeight: 1 }}>
                {avgScore}<span style={{ fontSize: 18, color: "#8A8073" }}>/10</span>
              </p>
              <p style={{ fontSize: 13.5, color: "#8A8073", marginTop: 6 }}>Average mock score</p>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
          <span style={{ fontSize: 13.5, color: "#C9BFB2" }}>DevOps track progress</span>
          <span style={{ fontSize: 13.5, color: "#8A8073" }}>{trackPct}%</span>
        </div>
        <div style={{ height: 8, background: "#1C1917", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${trackPct}%`, height: "100%", background: "#F5A623", borderRadius: 999 }} />
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <p style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8073", fontWeight: 600, marginBottom: 14 }}>Recent activity</p>
        {recent.length === 0 ? (
          <div style={{ background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 18, padding: "54px 30px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 21, color: "#FDF6E3" }}>Nothing here — yet.</p>
            <p style={{ fontSize: 14, color: "#B3A799", maxWidth: 340, lineHeight: 1.55 }}>Complete a lesson or interview to see your history here.</p>
            <Link href="/lessons" style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600, color: "#F5A623", textDecoration: "none" }}>Start your first lesson →</Link>
          </div>
        ) : (
          <div style={{ background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 18, overflow: "hidden" }}>
            {recent.map((s, i) => {
              const color = scoreColor(s.score);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 24px", borderBottom: i < recent.length - 1 ? "1px solid rgba(253,246,227,0.05)" : "none" }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, color: "#FDF6E3", fontWeight: 500 }}>Mock Interview</p>
                    <p style={{ fontSize: 13, color: "#8A8073", marginTop: 2 }}>{scoreLabel(s.score)} · {formatDate(s.createdAt)}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: `${color}20`, color, flexShrink: 0 }}>
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
