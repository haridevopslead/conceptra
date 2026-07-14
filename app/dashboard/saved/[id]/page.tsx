import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import SeniorAnswerBox from "@/components/interview/senior-answer-box";
import SavedBookmarkToggle from "@/components/dashboard/saved-bookmark-toggle";

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

function SubScore({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;
  const color = scoreColor(score);
  return (
    <div className="flex flex-col items-center px-3 py-3 rounded-xl border" style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
      <span className="text-xl font-black" style={{ color }}>
        {score}<span className="text-sm font-medium text-gray-500">/10</span>
      </span>
      <span className="text-[11px] text-gray-400 mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

export const metadata = { title: "Saved Answer — Conceptra" };

export default async function SavedAnswerDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const entry = await db.interviewSession.findUnique({
    where: { id: params.id },
    select: {
      id: true, userId: true, question: true, answer: true, topic: true,
      score: true, depthScore: true, accuracyScore: true, productionAwarenessScore: true,
      directAnswer: true, concreteExample: true, seniorInsight: true,
    },
  });

  // Ownership check — a saved answer is only ever visible to the user who saved it.
  if (!entry || entry.userId !== session.user.id) notFound();

  const hasSeniorAnswer = entry.directAnswer && entry.concreteExample && entry.seniorInsight;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "56px 64px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
      <Link href="/dashboard/saved" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--muted)", textDecoration: "none" }}>
        ← Saved Answers
      </Link>

      {entry.topic && (
        <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", padding: "5px 11px", borderRadius: 999, background: "var(--surface-2)", color: "var(--accent-text)" }}>
          {entry.topic.toUpperCase()}
        </span>
      )}

      <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 500, color: "var(--foreground)", lineHeight: 1.35 }}>
        {entry.question ?? "Mock Interview"}
      </h1>

      {entry.answer && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Answer</label>
          <div
            className="w-full rounded-xl px-4 py-3 text-sm text-gray-300 border border-white/10 leading-relaxed whitespace-pre-wrap"
            style={{ backgroundColor: "#211C18" }}
          >
            {entry.answer}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 p-6" style={{ backgroundColor: "#211C18" }}>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center shrink-0">
            <div className="text-5xl font-black leading-none" style={{ color: scoreColor(entry.score) }}>
              {entry.score}<span className="text-2xl font-bold text-gray-500">/10</span>
            </div>
            <p className="text-sm font-semibold mt-1" style={{ color: scoreColor(entry.score) }}>{scoreLabel(entry.score)}</p>
          </div>
          <div className="w-px h-14 bg-white/10 shrink-0 hidden sm:block" />
          <div className="flex-1 grid grid-cols-3 gap-3">
            <SubScore label="Depth" score={entry.depthScore} />
            <SubScore label="Accuracy" score={entry.accuracyScore} />
            <SubScore label="Production Awareness" score={entry.productionAwarenessScore} />
          </div>
        </div>
      </div>

      {hasSeniorAnswer && (
        <SeniorAnswerBox
          color="#F5A623" bg="rgba(245,166,35,0.06)" border="rgba(245,166,35,0.25)"
          directAnswer={entry.directAnswer!} concreteExample={entry.concreteExample!} seniorInsight={entry.seniorInsight!}
        />
      )}

      <SavedBookmarkToggle sessionId={entry.id} />
    </div>
  );
}
