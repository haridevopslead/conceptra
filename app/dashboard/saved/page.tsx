import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function scoreColor(n: number) {
  if (n >= 8) return "#F5A623";
  if (n >= 6) return "#9CAE86";
  if (n >= 4) return "#D6A24E";
  return "#C57B6B";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export const metadata = { title: "Saved Answers — Conceptra" };

export default async function SavedAnswersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let saved: {
    id: string;
    question: string | null;
    topic: string | null;
    score: number;
    createdAt: Date;
  }[] = [];
  try {
    saved = await db.interviewSession.findMany({
      where: { userId: session.user.id, bookmarked: true },
      select: { id: true, question: true, topic: true, score: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB unavailable — show empty state
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "56px 64px 80px", display: "flex", flexDirection: "column", gap: 26 }}>
      <div>
        <p style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8A8073", fontWeight: 600, marginBottom: 10 }}>
          Before the real thing
        </p>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "#FDF6E3", letterSpacing: "-0.01em" }}>
          Saved Answers
        </h1>
        <p style={{ fontSize: 15, color: "#C9BFB2", marginTop: 8 }}>
          Answers you bookmarked from Quick Practice — come back here to review them before your interview.
        </p>
      </div>

      {saved.length === 0 ? (
        <div style={{ background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 18, padding: "54px 30px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <p style={{ fontFamily: "'Newsreader', serif", fontSize: 21, color: "#FDF6E3" }}>Nothing saved yet.</p>
          <p style={{ fontSize: 14, color: "#B3A799", maxWidth: 360, lineHeight: 1.55 }}>
            Tap the bookmark icon on any Quick Practice result to save it here for review later.
          </p>
          <Link href="/interview" style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600, color: "#F5A623", textDecoration: "none" }}>
            Start practicing →
          </Link>
        </div>
      ) : (
        <div style={{ background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 18, overflow: "hidden" }}>
          {saved.map((s, i) => {
            const color = scoreColor(s.score);
            return (
              <Link
                key={s.id}
                href={`/dashboard/saved/${s.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "18px 24px",
                  borderBottom: i < saved.length - 1 ? "1px solid rgba(253,246,227,0.05)" : "none",
                  textDecoration: "none", color: "inherit",
                }}
              >
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, color: "#FDF6E3", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.question ?? "Mock Interview"}
                  </p>
                  <p style={{ fontSize: 13, color: "#8A8073", marginTop: 2 }}>
                    {s.topic ? `${s.topic} · ` : ""}{formatDate(s.createdAt)}
                  </p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: `${color}20`, color, flexShrink: 0 }}>
                  {s.score}/10
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
