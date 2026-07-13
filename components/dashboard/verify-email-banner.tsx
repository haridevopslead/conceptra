"use client";

import { useState } from "react";

export default function VerifyEmailBanner({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function resend() {
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error ?? "Failed to send email. Please try again.");
        setStatus("idle");
        return;
      }
      setMessage(data?.alreadyVerified ? "Already verified — refresh the page." : `Verification email sent to ${email}.`);
      setStatus("sent");
    } catch {
      setMessage("Network error. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
        background: "rgba(197,66,66,0.08)",
        border: "1px solid rgba(197,66,66,0.28)",
        borderRadius: 16,
        padding: "16px 22px",
      }}
    >
      <div>
        <p style={{ fontSize: 14.5, fontWeight: 600, color: "#FDF6E3" }}>
          Verify your email to unlock AI mock interviews
        </p>
        <p style={{ fontSize: 13, color: "#C9BFB2", marginTop: 3 }}>
          {message ?? `We sent a verification link to ${email} — check your inbox.`}
        </p>
      </div>
      <button
        onClick={resend}
        disabled={status === "sending"}
        style={{
          flexShrink: 0,
          background: "transparent",
          border: "1px solid rgba(197,66,66,0.4)",
          color: "#C57B6B",
          fontWeight: 600,
          fontSize: 13.5,
          padding: "10px 18px",
          borderRadius: 10,
          cursor: status === "sending" ? "not-allowed" : "pointer",
          opacity: status === "sending" ? 0.6 : 1,
          fontFamily: "inherit",
        }}
      >
        {status === "sending" ? "Sending…" : "Resend verification email"}
      </button>
    </div>
  );
}
