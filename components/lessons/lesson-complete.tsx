"use client";

import { useState } from "react";
import Link from "next/link";

type NextLesson = {
  slug: string;
  title: string;
  topics: string[];
  durationMinutes: number;
} | null;

type Props = {
  slug: string;
  nextLesson: NextLesson;
  initialCompleted: boolean;
};

export default function LessonComplete({ slug, nextLesson, initialCompleted }: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markComplete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${slug}/complete`, { method: "POST" });
      if (res.ok) {
        setCompleted(true);
      } else {
        setError("Could not save progress. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl border border-white/10 p-6 mt-5 flex flex-col items-center gap-5 text-center"
      style={{ backgroundColor: "#211C18" }}
    >
      {completed ? (
        /* ── Completed state ── */
        <>
          <div style={{ fontSize: 36 }}>✓</div>
          <p style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 500, color: "#9CAE86" }}>
            Brief Complete!
          </p>
          <p style={{ fontSize: 14, color: "#8A8073" }}>
            Great work. Keep the momentum going.
          </p>

          {nextLesson ? (
            <Link
              href={`/lessons/${nextLesson.slug}`}
              style={{
                width: "100%",
                display: "block",
                padding: "14px 24px",
                borderRadius: 12,
                background: "#F5A623",
                color: "#1C1917",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Next: {nextLesson.title} →
            </Link>
          ) : (
            <>
              <p style={{ fontSize: 14, color: "#B3A799", lineHeight: 1.6 }}>
                You&rsquo;ve completed all available briefs! More coming soon.
              </p>
              <Link
                href="/lessons"
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "1px solid rgba(253,246,227,0.15)",
                  color: "#FDF6E3",
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Back to Interview Briefs
              </Link>
            </>
          )}
        </>
      ) : (
        /* ── Not yet completed state ── */
        <>
          {error && (
            <p style={{ fontSize: 13, color: "#C57B6B" }}>✗ {error}</p>
          )}

          <button
            onClick={markComplete}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px 24px",
              borderRadius: 12,
              background: "#F5A623",
              color: "#1C1917",
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {loading ? "Saving…" : "Mark as Complete"}
          </button>

          {/* Next lesson preview — always visible below the complete button */}
          {nextLesson ? (
            <div style={{ width: "100%", borderTop: "1px solid rgba(253,246,227,0.07)", paddingTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6E665C", marginBottom: 10, textAlign: "left" }}>
                Up Next
              </p>
              <Link
                href={`/lessons/${nextLesson.slug}`}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "13px 24px",
                  borderRadius: 10,
                  background: "#F5A623",
                  color: "#1C1917",
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: "none",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              >
                Next Brief: {nextLesson.title} →
              </Link>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 8 }}>
                {nextLesson.topics[0] && (
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(245,166,35,0.12)", color: "#F5A623", fontWeight: 600 }}>
                    {nextLesson.topics[0]}
                  </span>
                )}
                <span style={{ fontSize: 11, color: "#6E665C" }}>
                  {nextLesson.durationMinutes} min
                </span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "#6E665C" }}>
              You&rsquo;ve reached the last brief. More coming soon.
            </p>
          )}
        </>
      )}
    </div>
  );
}
