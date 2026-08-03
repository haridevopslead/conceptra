import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import FaqAccordion from "@/components/home/faq-accordion";
import ThemeToggle from "@/components/ui/theme-toggle";

const TESTIMONIALS = [
  { quote: "I went from failing Kubernetes rounds to getting an offer at PhonePe in six weeks.", initials: "AR", name: "Ananya R.", role: "SRE · hired at PhonePe" },
  { quote: "The 9/10 answer examples showed me exactly what I was missing.", initials: "RM", name: "Rohit M.", role: "DevOps Engineer" },
  { quote: "Finally, prep that feels like a senior engineer is coaching you — not a textbook.", initials: "KS", name: "Karthik S.", role: "Platform Engineer" },
];

const BRANDS = ["Razorpay", "PhonePe", "Swiggy", "Flipkart"];

const FAQS = [
  {
    q: "Why not just use ChatGPT for a mock interview instead?",
    a: "General AI chat doesn't know what a senior interviewer at a company like Razorpay or Flipkart actually listens for. Conceptra's scoring rubric — Depth, Accuracy, Production Awareness — and every question are built from 10+ years of actually running these interviews, so your feedback is calibrated to a real hiring bar, not generic encouragement.",
  },
  {
    q: "Is the feedback actually accurate, or generic AI output?",
    a: "Every question and scoring rubric is reviewed for production accuracy by a practicing Lead DevOps Engineer — not auto-generated and shipped untouched. The AI applies that human-defined rubric consistently every time you practice.",
  },
  {
    q: "Is my data / my answers safe?",
    a: "Your practice answers are stored securely and used only to give you feedback and track your own progress. We don't share your data with employers or third parties.",
  },
  {
    q: "Who is this for?",
    a: "Working DevOps/SRE/platform engineers with real production experience who are actively interviewing and want to pressure-test how their answers would land — not a beginner course.",
  },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
        style={{
          padding: "14px 20px",
          background: "var(--nav-bg-translucent)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link href="/" style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, color: "var(--accent-text)", textDecoration: "none" }}>Conceptra</Link>
        <div className="flex items-center gap-4 sm:gap-8">
          <ThemeToggle />
          <Link href="/pricing" style={{ color: "var(--muted)", fontSize: 14, textDecoration: "none" }}>Pricing</Link>
          <Link href="/login" style={{ color: "var(--foreground)", fontSize: 14, fontWeight: 500, textDecoration: "none", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: 9 }}>Sign In</Link>
          <Link href="/register" style={{ background: "var(--accent)", color: "var(--accent-contrast)", fontWeight: 600, fontSize: 14, padding: "9px 18px", borderRadius: 9, textDecoration: "none" }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero — headline/CTA and the live demo card share the first screen */}
      <div className="relative overflow-hidden">
        <div className="absolute pointer-events-none" style={{ top: 20, left: "50%", transform: "translateX(-50%)", width: "min(1100px, 150vw)", height: 560, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(245,166,35,0.15) 0%, rgba(245,166,35,0.05) 38%, rgba(28,25,23,0) 70%)" }} />
        <div className="relative mx-auto px-5 sm:px-10" style={{ maxWidth: 1180, paddingTop: 92, paddingBottom: 40 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">

            {/* Left: headline, subheadline, CTAs, quote */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="flex items-center gap-3 mb-5">
                <span style={{ width: 28, height: 1, background: "rgba(245,166,35,0.5)" }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-text)" }}>AI-Powered DevOps Coaching</span>
              </div>

              <h1
                className="mb-4"
                style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: "clamp(36px, 6vw, 62px)", lineHeight: 1.08, color: "var(--foreground)", letterSpacing: "-0.015em" }}
              >
                Ace Your DevOps{" "}
                <em style={{ fontStyle: "italic", color: "var(--accent-text)" }}>Interview</em>
              </h1>

              <p className="mb-6" style={{ fontSize: "clamp(15px, 2.2vw, 18px)", lineHeight: 1.6, color: "var(--muted)", maxWidth: 480 }}>
                Coached by a Lead Engineer with 10+ years at top Indian tech companies. Know exactly what Razorpay and PhonePe interviewers want.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-4">
                <Link href="/try" className="text-center font-semibold" style={{ background: "var(--accent)", color: "var(--accent-contrast)", fontSize: 16, padding: "15px 32px", borderRadius: 12, textDecoration: "none" }}>
                  Try a real question — no signup
                </Link>
                <Link href="/register" className="text-center font-medium" style={{ background: "transparent", color: "var(--foreground)", fontSize: 16, border: "1px solid var(--border)", padding: "15px 32px", borderRadius: 12, textDecoration: "none" }}>
                  Start Free Trial
                </Link>
              </div>

              <Link href="/lessons" style={{ color: "var(--muted)", fontSize: 14, textDecoration: "none" }}>
                Browse Interview Briefs →
              </Link>

              <div className="flex items-center gap-3 mt-6 text-left">
                <div className="shrink-0" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Newsreader', serif", fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>HN</div>
                <div>
                  <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 14, color: "var(--muted)", maxWidth: 380, lineHeight: 1.5 }}>&ldquo;Built by the engineer who&rsquo;s been on both sides of the interview table.&rdquo;</p>
                  <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>Hari N. · Lead DevOps Engineer · 10+ years in production</p>
                </div>
              </div>
            </div>

            {/* Right: live scored demo — the strongest real product asset on
                the page, so it gets a visible lift (shadow + slight scale)
                to read as the hero's centerpiece rather than a supporting
                panel. Now theme-reactive (was hardcoded dark regardless of
                light/dark mode). */}
            <div className="w-full lg:scale-[1.04] lg:origin-center">
              <div className="rounded-2xl border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", padding: "8px", boxShadow: "0 24px 60px rgba(0,0,0,0.22)" }}>
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)" }}>
                    Live AI feedback — real example from the platform
                  </span>
                </div>

                <div className="rounded-xl p-5 sm:p-6 space-y-4" style={{ backgroundColor: "var(--surface-2)" }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
                      Question
                    </p>
                    <p style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(16px, 2.5vw, 19px)", color: "var(--foreground)", lineHeight: 1.4, fontWeight: 500 }}>
                      What happens when you run kubectl apply -f deployment.yaml?
                    </p>
                  </div>

                  <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="text-center shrink-0">
                        <div className="text-5xl font-black leading-none" style={{ color: "var(--accent-text)" }}>
                          8<span className="text-2xl font-bold" style={{ color: "var(--muted)" }}>/10</span>
                        </div>
                        <p className="text-sm font-semibold mt-1" style={{ color: "var(--accent-text)" }}>Excellent</p>
                      </div>
                      <div className="w-px h-14 shrink-0 hidden sm:block" style={{ background: "var(--border)" }} />
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-center px-3 py-3 rounded-xl border" style={{ backgroundColor: "rgba(197,123,107,0.06)", borderColor: "rgba(197,123,107,0.22)" }}>
                          <span className="text-xl font-black" style={{ color: "var(--danger-text)" }}>7<span className="text-sm font-medium" style={{ color: "var(--muted)" }}>/10</span></span>
                          <span className="text-[11px] mt-0.5 text-center leading-tight" style={{ color: "var(--muted)" }}>Depth</span>
                        </div>
                        <div className="flex flex-col items-center px-3 py-3 rounded-xl border" style={{ backgroundColor: "rgba(156,174,134,0.06)", borderColor: "rgba(156,174,134,0.2)" }}>
                          <span className="text-xl font-black" style={{ color: "var(--success-text)" }}>9<span className="text-sm font-medium" style={{ color: "var(--muted)" }}>/10</span></span>
                          <span className="text-[11px] mt-0.5 text-center leading-tight" style={{ color: "var(--muted)" }}>Accuracy</span>
                        </div>
                        <div className="flex flex-col items-center px-3 py-3 rounded-xl border" style={{ backgroundColor: "rgba(245,166,35,0.06)", borderColor: "rgba(245,166,35,0.25)" }}>
                          <span className="text-xl font-black" style={{ color: "var(--accent-text)" }}>8<span className="text-sm font-medium" style={{ color: "var(--muted)" }}>/10</span></span>
                          <span className="text-[11px] mt-0.5 text-center leading-tight" style={{ color: "var(--muted)" }}>Production Awareness</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border p-5 space-y-2" style={{ backgroundColor: "rgba(156,174,134,0.06)", borderColor: "rgba(156,174,134,0.2)" }}>
                    <p className="text-xs font-bold tracking-wider" style={{ color: "var(--success-text)" }}>✓ WHAT WAS STRONG</p>
                    <p className="text-sm leading-6" style={{ color: "var(--foreground)" }}>
                      Strong understanding of the declarative model and async nature of kubectl.
                    </p>
                  </div>

                  <div className="rounded-xl border p-5 space-y-2" style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
                    <p className="text-xs font-bold tracking-wider" style={{ color: "var(--muted)" }}>WHERE TO IMPROVE</p>
                    <p className="text-sm leading-6" style={{ color: "var(--foreground)" }}>
                      Could mention etcd and the control plane reconciliation loop for a 10/10 answer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <Link href="/try" className="text-center font-semibold" style={{ background: "var(--accent)", color: "var(--accent-contrast)", fontSize: 16, padding: "15px 32px", borderRadius: 12, textDecoration: "none" }}>
                  Try this question yourself — no signup →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Testimonials — one card per person with real breathing room and the
          actual quote (previously collected in TESTIMONIALS but never
          rendered — just a name/role/initials strip). The strongest quote
          (Ananya's, with a concrete outcome) is visually the lead card. */}
      <div className="mx-auto px-5 sm:px-10" style={{ maxWidth: 1080, paddingTop: 64, paddingBottom: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--muted)", textAlign: "center", marginBottom: 28 }}>
          What engineers say
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ quote, initials, name, role }, i) => (
            <div
              key={name}
              className={i === 0 ? "md:col-span-1 md:row-span-1" : ""}
              style={{
                background: i === 0 ? "var(--surface-2)" : "var(--surface)",
                border: i === 0 ? "1px solid rgba(245,166,35,0.3)" : "1px solid var(--border)",
                borderRadius: 18,
                padding: "26px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 16, lineHeight: 1.55, color: "var(--foreground)", flex: 1 }}>
                &ldquo;{quote}&rdquo;
              </p>
              <div className="flex items-center gap-2.5">
                <div className="shrink-0" style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Newsreader', serif", fontSize: 12, color: "var(--foreground)" }}>
                  {initials}
                </div>
                <div className="text-left">
                  <p style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 600 }}>{name}</p>
                  <p style={{ fontSize: 11.5, color: "var(--muted)" }}>{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand logos — no real logo assets available, so this leans on
          typography/spacing/dividers to read as a designed trust element
          instead of a bare inline text row. Worth sourcing real SVG logos
          later if that becomes a priority. */}
      <div className="mx-auto px-5 sm:px-10 flex flex-col items-center gap-7" style={{ maxWidth: 1080, paddingTop: 60, paddingBottom: 30 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, textAlign: "center", maxWidth: 640 }}>Our content is built around real interview patterns from companies like</p>
        <div
          className="flex flex-wrap justify-center items-stretch"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}
        >
          {BRANDS.map((b, i) => (
            <span
              key={b}
              style={{
                fontFamily: "'Newsreader', serif",
                fontSize: "clamp(16px, 3vw, 21px)",
                color: "var(--foreground)",
                fontWeight: 500,
                padding: "18px 32px",
                borderLeft: i > 0 ? "1px solid var(--border)" : undefined,
              }}
            >
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto px-5 sm:px-10" style={{ maxWidth: 760, paddingTop: 56, paddingBottom: 30 }}>
        <div className="flex items-center gap-3 justify-center mb-10">
          <span style={{ width: 28, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--muted)" }}>Questions</span>
          <span style={{ width: 28, height: 1, background: "var(--border)" }} />
        </div>
        <FaqAccordion items={FAQS} />
      </div>

      {/* Footer */}
      <footer className="mx-auto px-5 sm:px-10 text-center" style={{ maxWidth: 1080, marginTop: 32, paddingTop: 40, paddingBottom: 40, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>© 2026 Conceptra · Crafted for engineers who refuse to wing it.</span>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link href="/terms" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>Terms of Service</Link>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>·</span>
          <Link href="/privacy" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>Privacy Policy</Link>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>·</span>
          <a href="mailto:support@conceptra.in" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>support@conceptra.in</a>
        </div>
      </footer>
    </main>
  );
}
