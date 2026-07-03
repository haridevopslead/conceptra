"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DISMISS_KEY = "conceptra-welcome-banner-dismissed";

export default function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div
      style={{
        background: "#F5A623",
        borderRadius: 18,
        padding: "22px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
        position: "relative",
      }}
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss welcome banner"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 26,
          height: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: "none",
          background: "rgba(28,25,23,0.12)",
          color: "#1C1917",
          cursor: "pointer",
          fontSize: 15,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
      <div style={{ paddingRight: 32 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1C1917", lineHeight: 1.4 }}>
          Welcome to Conceptra! Start your first AI interview to see how you score. Takes 10 minutes.
        </p>
      </div>
      <Link
        href="/interview"
        style={{
          flexShrink: 0,
          background: "#1C1917",
          color: "#F5A623",
          fontWeight: 700,
          fontSize: 14,
          padding: "12px 22px",
          borderRadius: 11,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        Start my first interview →
      </Link>
    </div>
  );
}
