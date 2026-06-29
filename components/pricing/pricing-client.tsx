"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: any) => { open(): void };
  }
}

const FREE_FEATURES = [
  "3 AI mock interviews per month",
  "2 lessons access",
  "Basic scoring",
];

const PRO_FEATURES = [
  "Unlimited AI mock interviews",
  "All 40+ lessons",
  "Voice input",
  "Detailed scoring (Depth, Accuracy, Production Awareness)",
  "Session history",
  "Priority support",
];

type Props = {
  userName: string;
  userEmail: string;
  isLoggedIn: boolean;
  isPro: boolean;
};

export default function PricingClient({ userName, userEmail, isLoggedIn, isPro }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    if (!isLoggedIn) {
      router.push("/register");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderRes = await fetch("/api/payment/create-order", { method: "POST" });
      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error ?? "Failed to create order.");
      }
      const { orderId, amount, currency, keyId } = await orderRes.json();

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Conceptra",
        description: "Pro Plan — Annual Subscription",
        order_id: orderId,
        prefill: { name: userName, email: userEmail },
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
              setTimeout(() => router.push("/dashboard"), 2000);
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
        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 32, fontWeight: 500, color: "#FDF6E3" }}>
          Welcome to Pro!
        </h2>
        <p style={{ fontSize: 16, color: "#B3A799" }}>Your account has been upgraded. Redirecting to your dashboard…</p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="w-full max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <p style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8073", fontWeight: 600, marginBottom: 10 }}>
            Pricing
          </p>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(28px, 6vw, 46px)", fontWeight: 500, color: "#FDF6E3", lineHeight: 1.15 }}>
            Simple, honest pricing.
          </h1>
          <p style={{ fontSize: 16, color: "#8A8073", marginTop: 10 }}>One plan. Everything included.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FREE plan */}
          <div
            className="rounded-2xl border p-8 flex flex-col gap-5"
            style={{ backgroundColor: "#211C18", borderColor: "rgba(253,246,227,0.08)" }}
          >
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#8A8073", textTransform: "uppercase", marginBottom: 8 }}>Free</p>
              <p style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "#FDF6E3" }}>₹0</p>
              <p style={{ fontSize: 13, color: "#6E665C", marginTop: 4 }}>Forever free</p>
            </div>

            <ul className="flex flex-col gap-3 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span style={{ color: "#6E665C", marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: "#8A8073" }}>{f}</span>
                </li>
              ))}
            </ul>

            <div
              className="w-full py-3.5 rounded-xl text-center font-semibold text-sm"
              style={{ background: "rgba(253,246,227,0.05)", color: "#6E665C", border: "1px solid rgba(253,246,227,0.08)" }}
            >
              Current plan
            </div>
          </div>

          {/* PRO plan */}
          <div
            className="rounded-2xl border p-8 flex flex-col gap-5 relative"
            style={{ backgroundColor: "#2C2420", borderColor: "rgba(245,166,35,0.35)" }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
              style={{ background: "#F5A623", color: "#1C1917" }}
            >
              RECOMMENDED
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#F5A623", textTransform: "uppercase", marginBottom: 8 }}>Pro</p>
              <div className="flex items-baseline gap-2">
                <p style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "#FDF6E3" }}>₹2,999</p>
                <span style={{ fontSize: 14, color: "#8A8073" }}>/ year</span>
              </div>
              <p style={{ fontSize: 13, color: "#6E665C", marginTop: 4 }}>Billed annually · ₹250/month</p>
            </div>

            <ul className="flex flex-col gap-3 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span style={{ color: "#F5A623", marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: "#C9BFB2" }}>{f}</span>
                </li>
              ))}
            </ul>

            {error && (
              <p style={{ fontSize: 13, color: "#C57B6B" }}>✗ {error}</p>
            )}

            {isPro ? (
              <div
                className="w-full py-3.5 rounded-xl text-center font-bold text-sm"
                style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" }}
              >
                ✓ You&rsquo;re on Pro
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-opacity"
                style={{ background: "#F5A623", color: "#1C1917", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {loading ? "Opening checkout…" : isLoggedIn ? "Upgrade to Pro — ₹2,999/year" : "Sign up to get started"}
              </button>
            )}

            <p style={{ fontSize: 12, color: "#6E665C", textAlign: "center" }}>
              7-day refund policy · Secure payment via Razorpay
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
