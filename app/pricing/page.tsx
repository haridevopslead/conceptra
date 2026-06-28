import Link from "next/link";

export default function PricingPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#1C1917" }}
    >
      <div className="w-full max-w-lg text-center space-y-6">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: "rgba(245,166,35,0.15)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" }}
        >
          Coming Soon
        </div>

        <h1
          style={{ fontFamily: "'Newsreader', serif", fontSize: 42, fontWeight: 500, color: "#FDF6E3", lineHeight: 1.2 }}
        >
          Conceptra Pro
        </h1>

        <p style={{ color: "#8A8073", fontSize: 16, lineHeight: 1.7 }}>
          Unlock every lesson and unlimited AI mock interviews with honest, senior-engineer-level feedback.
        </p>

        <div
          className="rounded-2xl border p-8 space-y-4 text-left"
          style={{ backgroundColor: "#2C2420", borderColor: "rgba(245,166,35,0.2)" }}
        >
          {[
            "All 13 lessons across 6 DevOps domains",
            "Unlimited mock interview sessions",
            "AI coaching with production-level feedback",
            "Priority support",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span style={{ color: "#F5A623" }}>✓</span>
              <span style={{ color: "#B3A799", fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </div>

        <p style={{ color: "#6E665C", fontSize: 13 }}>
          Pro plan pricing will be announced soon. Stay tuned.
        </p>

        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#F5A623", color: "#1C1917" }}
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
