"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Sun/moon icon button that flips next-themes between light and dark.
// Renders a stable-sized placeholder until mounted so the pre-hydration
// theme script (which runs before React) never causes a mismatch flash.
export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={className} style={{ width: 34, height: 34 }} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
      style={{
        width: 34, height: 34, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "transparent", border: "1px solid var(--border)",
        color: "var(--muted)", cursor: "pointer", flexShrink: 0,
      }}
    >
      {isDark ? (
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4.5" />
          <line x1="12" y1="1.5" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22.5" />
          <line x1="4.2" y1="4.2" x2="5.9" y2="5.9" />
          <line x1="18.1" y1="18.1" x2="19.8" y2="19.8" />
          <line x1="1.5" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22.5" y2="12" />
          <line x1="4.2" y1="19.8" x2="5.9" y2="18.1" />
          <line x1="18.1" y1="5.9" x2="19.8" y2="4.2" />
        </svg>
      ) : (
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path d="M20.5 14.5a8.5 8.5 0 1 1-9-11 6.7 6.7 0 0 0 9 11z" />
        </svg>
      )}
    </button>
  );
}
