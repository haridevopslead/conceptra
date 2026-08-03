"use client";

import { useState } from "react";
import Script from "next/script";
import { PLAN_PRICING } from "@/lib/plan-pricing";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: any) => { open(): void };
  }
}

const FREE_FEATURES = [
  "3 AI mock interviews per month",
  "2 briefs access",
  "Basic scoring",
];

const PRO_FEATURES = [
  "Unlimited AI mock interviews",
  "All interview briefs",
  "Voice input",
  "Detailed scoring (Depth, Accuracy, Production Awareness)",
  "Session history",
  "Priority support",
];

type PlanDurationKey = "monthly" | "quarterly";

const DURATIONS: { key: PlanDurationKey; label: string; price: string; sublabel: string }[] = [
  { key: "monthly", label: "1 Month", price: "₹699", sublabel: "Billed monthly" },
  { key: "quarterly", label: "3 Months", price: "₹1,499", sublabel: "₹500/month" },
];

// Derived from the same server-side pricing lookup create-order uses (never
// a hardcoded "28%" string), so the savings badge can't silently go stale if
// PLAN_PRICING ever changes. Compared on a per-day basis rather than
// assuming any duration equals an exact number of "months".
const MONTHLY_DAILY_RATE = PLAN_PRICING.monthly.amountPaise / PLAN_PRICING.monthly.days;
function savingsPercentFor(key: PlanDurationKey): number {
  const { amountPaise, days } = PLAN_PRICING[key];
  const dailyRate = amountPaise / days;
  // Floored, not rounded, so the claim never overstates the real saving.
  return Math.floor((1 - dailyRate / MONTHLY_DAILY_RATE) * 100);
}

type Props = {
  userName: string;
  userEmail: string;
  isLoggedIn: boolean;
  isPro: boolean;
};

export default function PricingClient({ userName, userEmail, isLoggedIn, isPro }: Props) {
  const [duration, setDuration] = useState<PlanDurationKey>("quarterly");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    if (!isLoggedIn) {
      window.location.href = "/register";
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: duration }),
      });
      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error ?? "Failed to create order.");
      }
      const { orderId, amount, currency, keyId } = await orderRes.json();

      const selected = DURATIONS.find((d) => d.key === duration)!;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Conceptra",
        description: `Pro Plan — ${selected.label}`,
        order_id: orderId,
        prefill: { name: userName, email: userEmail },
        // Razorpay's own checkout widget theming, not our page's CSS — this
        // stays a literal hex regardless of light/dark since it styles an
        // iframe Razorpay controls, not anything next-themes touches.
        theme: { color: "#F5A623" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setSuccess(true);
              setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
            } else {
              setError(verifyData.error ?? "Verification failed. Contact support@conceptra.in");
            }
          } catch {
            setError("Verification failed. Contact support@conceptra.in");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div style={{ fontSize: 56 }}>🎉</div>
        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 32, fontWeight: 500, color: "var(--foreground)" }}>
          Welcome to Pro!
        </h2>
        <p style={{ fontSize: 16, color: "var(--muted)" }}>Your account has been upgraded. Redirecting to your dashboard…</p>
      </div>
    );
  }

  const selectedDuration = DURATIONS.find((d) => d.key === duration)!;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="w-full max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <p style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, marginBottom: 10 }}>
            Pricing
          </p>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(28px, 6vw, 46px)", fontWeight: 500, color: "var(--foreground)", lineHeight: 1.15 }}>
            Interview prep that pays for itself in one offer.
          </h1>
          <p style={{ fontSize: 16, color: "var(--muted)", marginTop: 10 }}>
            Unlimited mock interviews with Hari, real feedback after every session. Pick 1 month or 3 — pay once, no auto-renewal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FREE plan */}
          <div
            className="rounded-2xl border p-8 flex flex-col gap-5"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>Free</p>
              <p style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "var(--foreground)" }}>₹0</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Forever free</p>
            </div>

            <ul className="flex flex-col gap-3 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span style={{ color: "var(--muted)", marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: "var(--muted)" }}>{f}</span>
                </li>
              ))}
            </ul>

            <div
              className="w-full py-3.5 rounded-xl text-center font-semibold text-sm"
              style={{ background: "var(--hover-overlay)", color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              Current plan
            </div>
          </div>

          {/* PRO plan */}
          <div
            className="rounded-2xl border p-8 flex flex-col gap-5 relative"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "rgba(245,166,35,0.35)" }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
              style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              RECOMMENDED
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent-text)", textTransform: "uppercase", marginBottom: 8 }}>Pro</p>

              {!isPro && (
                <div className="mb-5">
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 9 }}>
                    Choose your billing cycle
                  </p>
                  <div className="flex gap-3" role="radiogroup" aria-label="Plan duration">
                    {DURATIONS.map((d) => {
                      const savings = savingsPercentFor(d.key);
                      const selected = duration === d.key;
                      return (
                        <button
                          key={d.key}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setDuration(d.key)}
                          disabled={loading}
                          className="flex-1 rounded-xl text-center transition-colors relative"
                          style={{
                            padding: "14px 10px",
                            fontFamily: "inherit",
                            fontSize: 15,
                            fontWeight: 800,
                            cursor: loading ? "not-allowed" : "pointer",
                            background: selected ? "var(--accent)" : "var(--surface)",
                            color: selected ? "var(--accent-contrast)" : "var(--foreground)",
                            border: selected ? "2px solid var(--accent)" : "2px solid var(--border)",
                          }}
                        >
                          {d.label}
                          {savings > 0 && (
                            <span
                              style={{
                                position: "absolute",
                                top: -11,
                                right: -8,
                                background: "#9CAE86",
                                color: "var(--accent-contrast)",
                                fontSize: 10.5,
                                fontWeight: 800,
                                letterSpacing: "0.01em",
                                padding: "3px 8px",
                                borderRadius: 999,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Save {savings}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-baseline gap-2">
                <p style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "var(--foreground)" }}>{selectedDuration.price}</p>
                <span style={{ fontSize: 14, color: "var(--muted)" }}>/ {selectedDuration.label.toLowerCase()}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{selectedDuration.sublabel}</p>
            </div>

            <ul className="flex flex-col gap-3 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span style={{ color: "var(--accent-text)", marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: "var(--foreground)" }}>{f}</span>
                </li>
              ))}
            </ul>

            {error && (
              <p style={{ fontSize: 13, color: "var(--danger-text)" }}>✗ {error}</p>
            )}

            {isPro ? (
              <div
                className="w-full py-3.5 rounded-xl text-center font-bold text-sm"
                style={{ background: "rgba(245,166,35,0.15)", color: "var(--accent-text)", border: "1px solid rgba(245,166,35,0.3)" }}
              >
                ✓ You&rsquo;re on Pro
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-opacity"
                style={{ background: "var(--accent)", color: "var(--accent-contrast)", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {loading ? "Opening checkout…" : isLoggedIn ? `Upgrade to Pro — ${selectedDuration.price}` : "Sign up to get started"}
              </button>
            )}

            <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
              7-day refund policy · Secure payment via Razorpay
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
