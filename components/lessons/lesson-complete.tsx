"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  slug: string;
  nextSlug: string | null;
  initialCompleted: boolean;
};

export default function LessonComplete({ slug, nextSlug, initialCompleted }: Props) {
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
      className="rounded-2xl border border-white/10 p-6 mt-5 flex flex-col items-center gap-4 text-center"
      style={{ backgroundColor: "#211C18" }}
    >
      {completed ? (
        <>
          <div style={{ fontSize: 36 }}>✓</div>
          <p style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 500, color: "#9CAE86" }}>
            Lesson Complete!
          </p>
          <p style={{ fontSize: 14, color: "#8A8073" }}>
            Great work. Keep the momentum going.
          </p>
          {nextSlug ? (
            <Link
              href={`/lessons/${nextSlug}`}
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
              Next Lesson →
            </Link>
          ) : (
            <>
              <p style={{ fontSize: 14, color: "#B3A799", lineHeight: 1.6 }}>
                You&rsquo;ve completed all available lessons! Check back soon.
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
                Back to Lessons
              </Link>
            </>
          )}
        </>
      ) : (
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
        </>
      )}
    </div>
  );
}
