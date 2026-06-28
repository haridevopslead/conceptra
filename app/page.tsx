import Link from "next/link";

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

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#1C1917", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 44px", zIndex: 50, background: "rgba(28,25,23,0.82)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(253,246,227,0.06)" }}>
        <span style={{ fontFamily: "'Newsreader', serif", fontSize: 25, fontWeight: 600, color: "#F5A623" }}>Conceptra</span>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <Link href="/login" style={{ background: "none", border: "none", color: "#B3A799", fontSize: 15, cursor: "pointer", textDecoration: "none" }}>
            Sign In
          </Link>
          <Link href="/register" style={{ background: "#F5A623", color: "#1C1917", fontWeight: 600, fontSize: 15, border: "none", padding: "11px 22px", borderRadius: 10, cursor: "pointer", textDecoration: "none" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)", width: 940, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(245,166,35,0.17) 0%, rgba(245,166,35,0.055) 38%, rgba(28,25,23,0) 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto", padding: "182px 44px 70px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <span style={{ width: 30, height: 1, background: "rgba(245,166,35,0.5)" }} />
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: "#F5A623" }}>AI-Powered DevOps Coaching</span>
            <span style={{ width: 30, height: 1, background: "rgba(245,166,35,0.5)" }} />
          </div>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: 76, lineHeight: 1.04, color: "#FDF6E3", letterSpacing: "-0.015em", marginBottom: 28, maxWidth: 860 }}>
            Ace Your DevOps <em style={{ fontStyle: "italic", color: "#F5A623" }}>Interview</em>
          </h1>
          <p style={{ fontSize: 20, lineHeight: 1.6, color: "#C9BFB2", maxWidth: 600, marginBottom: 20 }}>
            Coached by a Lead Engineer with 10+ years at top Indian tech companies.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 44, textAlign: "left" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: "rgba(245,166,35,0.14)", border: "1px solid rgba(245,166,35,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Newsreader', serif", fontSize: 16, fontWeight: 600, color: "#F5A623" }}>HK</div>
            <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 18, color: "#8A8073", maxWidth: 470, lineHeight: 1.5 }}>&ldquo;Built by the engineer who&rsquo;s been on both sides of the interview table.&rdquo;</p>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/register" style={{ background: "#F5A623", color: "#1C1917", fontWeight: 600, fontSize: 16, border: "none", padding: "16px 34px", borderRadius: 12, cursor: "pointer", textDecoration: "none" }}>
              Start Free Trial
            </Link>
            <Link href="/lessons" style={{ background: "transparent", color: "#FDF6E3", fontWeight: 500, fontSize: 16, border: "1px solid rgba(253,246,227,0.18)", padding: "16px 34px", borderRadius: 12, cursor: "pointer", textDecoration: "none" }}>
              Browse Lessons
            </Link>
          </div>
        </div>
      </div>

      {/* 01 02 03 cards */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {CARDS.map(({ n, text }) => (
            <div key={n} style={{ background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 18, padding: "34px 30px", textAlign: "left" }}>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: 32, color: "rgba(245,166,35,0.5)", fontWeight: 500, marginBottom: 20 }}>{n}</div>
              <p style={{ fontFamily: "'Newsreader', serif", fontSize: 23, lineHeight: 1.35, color: "#FDF6E3", fontWeight: 500 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "60px 44px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 40 }}>
          <span style={{ width: 30, height: 1, background: "rgba(245,166,35,0.5)" }} />
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: "#F5A623" }}>What engineers say</span>
          <span style={{ width: 30, height: 1, background: "rgba(245,166,35,0.5)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {TESTIMONIALS.map(({ quote, initials, name, role }) => (
            <div key={name} style={{ background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 18, padding: "30px 28px" }}>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: 46, lineHeight: 0.4, color: "rgba(245,166,35,0.4)", height: 22 }}>&ldquo;</div>
              <p style={{ fontFamily: "'Newsreader', serif", fontSize: 18, lineHeight: 1.5, color: "#FDF6E3", marginBottom: 22 }}>{quote}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "rgba(245,166,35,0.14)", border: "1px solid rgba(245,166,35,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Newsreader', serif", fontSize: 14, color: "#F5A623" }}>{initials}</div>
                <div>
                  <p style={{ fontSize: 13.5, color: "#FDF6E3", fontWeight: 600 }}>{name}</p>
                  <p style={{ fontSize: 12, color: "#8A8073" }}>{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand logos */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "64px 44px 30px", display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <p style={{ fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase", color: "#8A8073", fontWeight: 600 }}>Join engineers preparing for</p>
        <div style={{ display: "flex", gap: 52, flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
          {BRANDS.map(b => (
            <span key={b} style={{ fontFamily: "'Newsreader', serif", fontSize: 27, color: "#C9BFB2", fontWeight: 500 }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ maxWidth: 1080, margin: "40px auto 0", padding: "46px 44px", textAlign: "center", borderTop: "1px solid rgba(253,246,227,0.06)" }}>
        <span style={{ fontSize: 13, color: "#6E665C" }}>© 2026 Conceptra · Crafted for engineers who refuse to wing it.</span>
      </footer>
    </main>
  );
}
