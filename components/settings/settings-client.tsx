"use client";

import { useState } from "react";
import Link from "next/link";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid rgba(253,246,227,0.1)",
  backgroundColor: "#17130F",
  color: "#FDF6E3",
  fontSize: 15,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#8A8073",
  marginBottom: 7,
  letterSpacing: "0.02em",
};

const CARD: React.CSSProperties = {
  background: "#2C2420",
  border: "1px solid rgba(253,246,227,0.07)",
  borderRadius: 20,
  padding: "28px 28px 24px",
  marginBottom: 20,
};

const SAVE_BTN: React.CSSProperties = {
  marginTop: 20,
  padding: "11px 22px",
  borderRadius: 10,
  background: "#F5A623",
  color: "#1C1917",
  fontWeight: 700,
  fontSize: 14,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

type Props = {
  initialName: string;
  email: string;
  plan: string;
};

export default function SettingsClient({ initialName, email, plan }: Props) {
  const [name, setName] = useState(initialName);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg({ ok: true, text: "Name updated successfully." });
      } else {
        setProfileMsg({ ok: false, text: data.error ?? "Failed to update name." });
      }
    } catch {
      setProfileMsg({ ok: false, text: "Network error. Please try again." });
    } finally {
      setProfileLoading(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ ok: true, text: "Password updated successfully." });
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        setPwMsg({ ok: false, text: data.error ?? "Failed to update password." });
      }
    } catch {
      setPwMsg({ ok: false, text: "Network error. Please try again." });
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <>
      {/* Profile section */}
      <section style={CARD}>
        <p style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#F5A623", fontWeight: 600, marginBottom: 18 }}>
          Profile
        </p>
        <form onSubmit={saveProfile}>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={INPUT_STYLE}
              placeholder="Your name"
              required
            />
          </div>
          <div style={{ marginBottom: 4 }}>
            <label style={LABEL_STYLE}>Email</label>
            <input
              type="email"
              value={email}
              readOnly
              style={{ ...INPUT_STYLE, color: "#6E665C", cursor: "not-allowed" }}
            />
            <p style={{ fontSize: 12, color: "#6E665C", marginTop: 6 }}>Email cannot be changed.</p>
          </div>
          {profileMsg && (
            <p style={{ fontSize: 13, color: profileMsg.ok ? "#9CAE86" : "#C57B6B", marginTop: 14 }}>
              {profileMsg.ok ? "✓ " : "✗ "}{profileMsg.text}
            </p>
          )}
          <button type="submit" style={SAVE_BTN} disabled={profileLoading}>
            {profileLoading ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </section>

      {/* Plan & Billing section */}
      <section style={CARD}>
        <p style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#F5A623", fontWeight: 600, marginBottom: 18 }}>
          Plan &amp; Billing
        </p>
        {plan === "PRO" ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 500, color: "#FDF6E3" }}>Pro Plan</span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", padding: "3px 9px", borderRadius: 999, background: "#F5A623", color: "#1C1917" }}>
                ACTIVE
              </span>
            </div>
            <p style={{ fontSize: 14, color: "#8A8073" }}>Billed annually at ₹2,999</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: "#B3A799", lineHeight: 1.6, marginBottom: 18 }}>
              You&rsquo;re on the <strong style={{ color: "#FDF6E3" }}>Free plan</strong>. Upgrade to unlock all interview briefs and unlimited AI mock interviews.
            </p>
            <Link
              href="/pricing"
              style={{ display: "inline-block", background: "#F5A623", color: "#1C1917", fontWeight: 700, fontSize: 14, padding: "11px 22px", borderRadius: 10, textDecoration: "none" }}
            >
              Upgrade to Pro — ₹2,999/year
            </Link>
          </div>
        )}
      </section>

      {/* Security section */}
      <section style={CARD}>
        <p style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#F5A623", fontWeight: 600, marginBottom: 18 }}>
          Security
        </p>
        <form onSubmit={savePassword}>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>Current password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              style={INPUT_STYLE}
              placeholder="••••••••"
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>New password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              style={INPUT_STYLE}
              placeholder="At least 8 characters"
              required
            />
          </div>
          <div style={{ marginBottom: 4 }}>
            <label style={LABEL_STYLE}>Confirm new password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              style={INPUT_STYLE}
              placeholder="Repeat your password"
              required
            />
          </div>
          {pwMsg && (
            <p style={{ fontSize: 13, color: pwMsg.ok ? "#9CAE86" : "#C57B6B", marginTop: 14 }}>
              {pwMsg.ok ? "✓ " : "✗ "}{pwMsg.text}
            </p>
          )}
          <button type="submit" style={SAVE_BTN} disabled={pwLoading}>
            {pwLoading ? "Saving…" : "Update Password"}
          </button>
        </form>
      </section>
    </>
  );
}
