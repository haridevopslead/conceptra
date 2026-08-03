"use client";

import { useState } from "react";

export default function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: copied ? "var(--success-text)" : "var(--muted)",
        background: "none",
        border: `1px solid ${copied ? "rgba(156,174,134,0.3)" : "var(--border)"}`,
        borderRadius: 6,
        padding: "3px 10px",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all .15s",
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}
