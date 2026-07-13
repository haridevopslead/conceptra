"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailBanner({ email }: { email: string }) {
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = useState(email);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [editStatus, setEditStatus] = useState<"idle" | "saving">("idle");
  const [editMessage, setEditMessage] = useState<string | null>(null);

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
      setMessage(data?.alreadyVerified ? "Already verified — refresh the page." : `Verification email sent to ${currentEmail}.`);
      setStatus("sent");
    } catch {
      setMessage("Network error. Please try again.");
      setStatus("idle");
    }
  }

  async function submitEmailChange(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEditStatus("saving");
    setEditMessage(null);
    try {
      const res = await fetch("/api/auth/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditMessage(data?.error ?? "Failed to update email. Please try again.");
        setEditStatus("idle");
        return;
      }
      setCurrentEmail(data.email);
      setNewEmail("");
      setShowEdit(false);
      setEditStatus("idle");
      setMessage(`Email updated to ${data.email} — check your inbox for a new verification link.`);
      setStatus("sent");
      router.refresh();
    } catch {
      setEditMessage("Network error. Please try again.");
      setEditStatus("idle");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        background: "rgba(197,66,66,0.08)",
        border: "1px solid rgba(197,66,66,0.28)",
        borderRadius: 16,
        padding: "16px 22px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 14.5, fontWeight: 600, color: "#FDF6E3" }}>
            Verify your email to unlock AI mock interviews
          </p>
          <p style={{ fontSize: 13, color: "#C9BFB2", marginTop: 3 }}>
            {message ?? `We sent a verification link to ${currentEmail} — check your inbox.`}
          </p>
          {!showEdit && (
            <button
              onClick={() => { setShowEdit(true); setEditMessage(null); }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                marginTop: 6,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#8A8073",
                textDecoration: "underline",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Wrong email? Update it
            </button>
          )}
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

      {showEdit && (
        <form
          onSubmit={submitEmailChange}
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            paddingTop: 12,
            borderTop: "1px solid rgba(197,66,66,0.2)",
          }}
        >
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter the correct email address"
            style={{
              flex: "1 1 220px",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid rgba(253,246,227,0.15)",
              background: "#17130F",
              color: "#FDF6E3",
              fontSize: 13.5,
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={editStatus === "saving"}
            style={{
              background: "#F5A623",
              color: "#1C1917",
              fontWeight: 700,
              fontSize: 13.5,
              padding: "9px 16px",
              borderRadius: 8,
              border: "none",
              cursor: editStatus === "saving" ? "not-allowed" : "pointer",
              opacity: editStatus === "saving" ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {editStatus === "saving" ? "Updating…" : "Update"}
          </button>
          <button
            type="button"
            onClick={() => { setShowEdit(false); setEditMessage(null); setNewEmail(""); }}
            style={{
              background: "none",
              border: "none",
              color: "#8A8073",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          {editMessage && (
            <p style={{ width: "100%", fontSize: 12.5, color: "#C57B6B" }}>{editMessage}</p>
          )}
        </form>
      )}
    </div>
  );
}
