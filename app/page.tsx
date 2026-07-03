import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const TESTIMONIALS = [
  { quote: "I went from failing Kubernetes rounds to getting an offer at PhonePe in six weeks.", initials: "AR", name: "Ananya R.", role: "SRE · hired at PhonePe" },
  { quote: "The 9/10 answer examples showed me exactly what I was missing.", initials: "RM", name: "Rohit M.", role: "DevOps Engineer" },
  { quote: "Finally, prep that feels like a senior engineer is coaching you — not a textbook.", initials: "KS", name: "Karthik S.", role: "Platform Engineer" },
];

const CARDS = [
  { n: "01", text: "From nervous to confident in four weeks." },
  { n: "02", text: "Know exactly what Razorpay and PhonePe interviewers want." },
  { n: "03", text: "Answer like a senior engineer — not a textbook." },
];

const BRANDS = ["Razorpay", "PhonePe", "Swiggy", "Flipkart"];

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen" style={{ background: "#1C1917", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
        style={{
          padding: "18px 20px",
          background: "rgba(28,25,23,0.82)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(253,246,227,0.06)",
        }}
      >
        <Link href="/" style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, color: "#F5A623", textDecoration: "none" }}>Conceptra</Link>
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/pricing" style={{ color: "#B3A799", fontSize: 14, textDecoration: "none" }}>Pricing</Link>
          <Link href="/login" style={{ color: "#B3A799", fontSize: 14, textDecoration: "none" }}>Sign In</Link>
          <Link href="/register" style={{ background: "#F5A623", color: "#1C1917", fontWeight: 600, fontSize: 14, padding: "9px 18px", borderRadius: 9, textDecoration: "none" }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute pointer-events-none" style={{ top: 30, left: "50%", transform: "translateX(-50%)", width: "min(940px, 140vw)", height: 600, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(245,166,35,0.17) 0%, rgba(245,166,35,0.055) 38%, rgba(28,25,23,0) 70%)" }} />
        <div className="relative mx-auto flex flex-col items-center text-center px-5 sm:px-10" style={{ maxWidth: 1080, paddingTop: 150, paddingBottom: 60 }}>

          <div className="flex items-center gap-3 mb-8">
            <span style={{ width: 28, height: 1, background: "rgba(245,166,35,0.5)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#F5A623" }}>AI-Powered DevOps Coaching</span>
            <span style={{ width: 28, height: 1, background: "rgba(245,166,35,0.5)" }} />
          </div>

          <h1
            className="mb-6"
            style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: "clamp(38px, 9vw, 76px)", lineHeight: 1.06, color: "#FDF6E3", letterSpacing: "-0.015em", maxWidth: 860 }}
          >
            Ace Your DevOps{" "}
            <em style={{ fontStyle: "italic", color: "#F5A623" }}>Interview</em>
          </h1>

          <p className="mb-5" style={{ fontSize: "clamp(15px, 3vw, 20px)", lineHeight: 1.6, color: "#C9BFB2", maxWidth: 560 }}>
            Coached by a Lead Engineer with 10+ years at top Indian tech companies.
          </p>

          <div className="flex items-center gap-3 mb-10 text-left">
            <div className="shrink-0" style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(245,166,35,0.14)", border: "1px solid rgba(245,166,35,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Newsreader', serif", fontSize: 14, fontWeight: 600, color: "#F5A623" }}>HN</div>
            <div>
              <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: "clamp(14px, 2.5vw, 17px)", color: "#8A8073", maxWidth: 420, lineHeight: 1.5 }}>&ldquo;Built by the engineer who&rsquo;s been on both sides of the interview table.&rdquo;</p>
              <p style={{ fontSize: 12, color: "#6E665C", marginTop: 6 }}>Hari N. · Lead DevOps Engineer · 10+ years in production</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-center">
            <Link href="/register" className="text-center font-semibold" style={{ background: "#F5A623", color: "#1C1917", fontSize: 16, padding: "15px 32px", borderRadius: 12, textDecoration: "none" }}>
              Start Free Trial
            </Link>
            <Link href="/lessons" className="text-center font-medium" style={{ background: "transparent", color: "#FDF6E3", fontSize: 16, border: "1px solid rgba(253,246,227,0.18)", padding: "15px 32px", borderRadius: 12, textDecoration: "none" }}>
              Browse Interview Briefs
            </Link>
          </div>
        </div>
      </div>

      {/* See it in action */}
      <div className="mx-auto px-5 sm:px-10" style={{ maxWidth: 900, paddingTop: 20, paddingBottom: 70 }}>
        <div className="text-center mb-10">
          <h2 style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: "clamp(26px, 5vw, 40px)", color: "#FDF6E3", letterSpacing: "-0.01em", marginBottom: 12 }}>
            See exactly how it works
          </h2>
          <p style={{ fontSize: "clamp(14px, 2.5vw, 17px)", color: "#B3A799", maxWidth: 520, margin: "0 auto", lineHeight: 1.5 }}>
            Answer a question. Get scored like a senior engineer would score you.
          </p>
        </div>

        <div className="rounded-2xl border" style={{ backgroundColor: "#211C18", borderColor: "rgba(253,246,227,0.08)", padding: "8px" }}>
          <div className="flex items-center gap-2 px-4 py-3">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5A623" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A8073" }}>
              Live AI feedback — real example from the platform
            </span>
          </div>

          <div className="rounded-xl p-5 sm:p-6 space-y-5" style={{ backgroundColor: "#17130F" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#F5A623", marginBottom: 8 }}>
                Question
              </p>
              <p style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(16px, 2.5vw, 19px)", color: "#FDF6E3", lineHeight: 1.4, fontWeight: 500 }}>
                What happens when you run kubectl apply -f deployment.yaml?
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 p-5 sm:p-6" style={{ backgroundColor: "#211C18" }}>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center shrink-0">
                  <div className="text-5xl font-black leading-none" style={{ color: "#F5A623" }}>
                    8<span className="text-2xl font-bold text-gray-500">/10</span>
                  </div>
                  <p className="text-sm font-semibold mt-1" style={{ color: "#F5A623" }}>Excellent</p>
                </div>
                <div className="w-px h-14 bg-white/10 shrink-0 hidden sm:block" />
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center px-3 py-3 rounded-xl border" style={{ backgroundColor: "rgba(197,123,107,0.06)", borderColor: "rgba(197,123,107,0.22)" }}>
                    <span className="text-xl font-black" style={{ color: "#C57B6B" }}>7<span className="text-sm font-medium text-gray-500">/10</span></span>
                    <span className="text-[11px] text-gray-400 mt-0.5 text-center leading-tight">Depth</span>
                  </div>
                  <div className="flex flex-col items-center px-3 py-3 rounded-xl border" style={{ backgroundColor: "rgba(156,174,134,0.06)", borderColor: "rgba(156,174,134,0.2)" }}>
                    <span className="text-xl font-black" style={{ color: "#9CAE86" }}>9<span className="text-sm font-medium text-gray-500">/10</span></span>
                    <span className="text-[11px] text-gray-400 mt-0.5 text-center leading-tight">Accuracy</span>
                  </div>
                  <div className="flex flex-col items-center px-3 py-3 rounded-xl border" style={{ backgroundColor: "rgba(245,166,35,0.06)", borderColor: "rgba(245,166,35,0.25)" }}>
                    <span className="text-xl font-black" style={{ color: "#F5A623" }}>8<span className="text-sm font-medium text-gray-500">/10</span></span>
                    <span className="text-[11px] text-gray-400 mt-0.5 text-center leading-tight">Production Awareness</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-5 space-y-2" style={{ backgroundColor: "rgba(156,174,134,0.06)", borderColor: "rgba(156,174,134,0.2)" }}>
              <p className="text-xs font-bold tracking-wider" style={{ color: "#9CAE86" }}>✓ WHAT WAS STRONG</p>
              <p className="text-sm text-gray-300 leading-6">
                Strong understanding of the declarative model and async nature of kubectl.
              </p>
            </div>

            <div className="rounded-xl border p-5 space-y-2" style={{ backgroundColor: "rgba(245,166,35,0.06)", borderColor: "rgba(245,166,35,0.25)" }}>
              <p className="text-xs font-bold tracking-wider" style={{ color: "#F5A623" }}>⚡ WHERE TO IMPROVE</p>
              <p className="text-sm text-gray-300 leading-6">
                Could mention etcd and the control plane reconciliation loop for a 10/10 answer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 01 02 03 cards */}
      <div className="mx-auto px-5 sm:px-10" style={{ maxWidth: 1080, paddingBottom: 30 }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {CARDS.map(({ n, text }) => (
            <div key={n} style={{ background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 18, padding: "30px 26px" }}>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: 30, color: "rgba(245,166,35,0.5)", fontWeight: 500, marginBottom: 18 }}>{n}</div>
              <p style={{ fontFamily: "'Newsreader', serif", fontSize: 21, lineHeight: 1.35, color: "#FDF6E3", fontWeight: 500 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="mx-auto px-5 sm:px-10" style={{ maxWidth: 1080, paddingTop: 50, paddingBottom: 10 }}>
        <div className="flex items-center gap-3 justify-center mb-8">
          <span style={{ width: 28, height: 1, background: "rgba(245,166,35,0.5)" }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#F5A623" }}>What engineers say</span>
          <span style={{ width: 28, height: 1, background: "rgba(245,166,35,0.5)" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ quote, initials, name, role }) => (
            <div key={name} style={{ background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 18, padding: "26px 24px" }}>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: 44, lineHeight: 0.4, color: "rgba(245,166,35,0.4)", height: 20 }}>&ldquo;</div>
              <p style={{ fontFamily: "'Newsreader', serif", fontSize: 17, lineHeight: 1.5, color: "#FDF6E3", marginBottom: 20, marginTop: 12 }}>{quote}</p>
              <div className="flex items-center gap-3">
                <div className="shrink-0" style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(245,166,35,0.14)", border: "1px solid rgba(245,166,35,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Newsreader', serif", fontSize: 13, color: "#F5A623" }}>{initials}</div>
                <div>
                  <p style={{ fontSize: 13, color: "#FDF6E3", fontWeight: 600 }}>{name}</p>
                  <p style={{ fontSize: 11.5, color: "#8A8073" }}>{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand logos */}
      <div className="mx-auto px-5 sm:px-10 flex flex-col items-center gap-6" style={{ maxWidth: 1080, paddingTop: 56, paddingBottom: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#8A8073", fontWeight: 600 }}>Join engineers preparing for</p>
        <div className="flex flex-wrap gap-6 sm:gap-12 justify-center items-center">
          {BRANDS.map(b => (
            <span key={b} style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(18px, 4vw, 26px)", color: "#C9BFB2", fontWeight: 500 }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto px-5 sm:px-10 text-center" style={{ maxWidth: 1080, marginTop: 32, paddingTop: 40, paddingBottom: 40, borderTop: "1px solid rgba(253,246,227,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12.5, color: "#6E665C" }}>© 2026 Conceptra · Crafted for engineers who refuse to wing it.</span>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link href="/terms" style={{ fontSize: 12, color: "#6E665C", textDecoration: "none" }}>Terms of Service</Link>
          <span style={{ fontSize: 12, color: "#3A322C" }}>·</span>
          <Link href="/privacy" style={{ fontSize: 12, color: "#6E665C", textDecoration: "none" }}>Privacy Policy</Link>
          <span style={{ fontSize: 12, color: "#3A322C" }}>·</span>
          <a href="mailto:support@conceptra.in" style={{ fontSize: 12, color: "#6E665C", textDecoration: "none" }}>support@conceptra.in</a>
        </div>
      </footer>
    </main>
  );
}
