"use client";

import { useState } from "react";
import Link from "next/link";

export default function SavedBookmarkToggle({ sessionId }: { sessionId: string }) {
  const [bookmarked, setBookmarked] = useState(true);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    if (saving) return;
    const next = !bookmarked;
    setBookmarked(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/interview/sessions/${sessionId}/bookmark`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarked: next }),
      });
      if (!res.ok) setBookmarked(!next);
    } catch {
      setBookmarked(!next);
    } finally {
      setSaving(false);
    }
  }

  if (!bookmarked) {
    return (
      <div className="flex items-center gap-3">
        <span style={{ fontSize: 13.5, color: "#8A8073" }}>Removed from Saved Answers.</span>
        <Link href="/dashboard/saved" style={{ fontSize: 13.5, fontWeight: 600, color: "#F5A623", textDecoration: "none" }}>
          Back to list →
        </Link>
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className="flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
      style={{ color: "#F5A623", background: "transparent", border: "none", cursor: "pointer" }}
    >
      <svg width="16" height="16" fill="currentColor" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M6 2a2 2 0 0 0-2 2v18l8-6 8 6V4a2 2 0 0 0-2-2H6z" />
      </svg>
      Remove from Saved Answers
    </button>
  );
}
