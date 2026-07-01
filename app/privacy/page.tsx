import Link from "next/link";

export const metadata = { title: "Privacy Policy — Conceptra" };

const SECTION_STYLE: React.CSSProperties = { marginBottom: 36 };
const H2_STYLE: React.CSSProperties = { fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 500, color: "#FDF6E3", marginBottom: 12 };
const P_STYLE: React.CSSProperties = { fontSize: 15, color: "#B3A799", lineHeight: 1.75, marginBottom: 10 };

export default function PrivacyPage() {
  return (
    <main style={{ backgroundColor: "#1C1917", minHeight: "100vh", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav
        style={{ padding: "18px 24px", borderBottom: "1px solid rgba(253,246,227,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <Link href="/" style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, color: "#F5A623", textDecoration: "none" }}>
          Conceptra
        </Link>
        <Link href="/" style={{ fontSize: 14, color: "#8A8073", textDecoration: "none" }}>← Back</Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
        <p style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8073", fontWeight: 600, marginBottom: 10 }}>Legal</p>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(28px, 6vw, 42px)", fontWeight: 500, color: "#FDF6E3", marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: "#6E665C", marginBottom: 52 }}>Last updated: 27 June 2026</p>

        <div style={SECTION_STYLE}>
          <p style={P_STYLE}>
            This Privacy Policy describes how Conceptra (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and protects your personal information when you use our Service at conceptra.in. By using Conceptra, you consent to the practices described in this policy.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>1. Information We Collect</h2>
          <p style={P_STYLE}><strong style={{ color: "#FDF6E3" }}>Account information:</strong> When you register, we collect your name and email address.</p>
          <p style={P_STYLE}><strong style={{ color: "#FDF6E3" }}>Usage data:</strong> We collect data on interview briefs completed, mock interview sessions, scores, and topics selected so we can personalise your experience and track your progress.</p>
          <p style={P_STYLE}><strong style={{ color: "#FDF6E3" }}>Interview answers:</strong> The text of your interview answers is sent to our AI provider (Anthropic) for evaluation. We do not permanently store your raw answer text in our database — only the evaluation scores and feedback are retained.</p>
          <p style={P_STYLE}><strong style={{ color: "#FDF6E3" }}>Payment information:</strong> We do not store payment card details. Payments are handled entirely by Razorpay, which has its own privacy policy.</p>
          <p style={P_STYLE}><strong style={{ color: "#FDF6E3" }}>Technical data:</strong> We may collect IP addresses, browser type, and device information for security and analytics purposes.</p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>2. How We Use Your Information</h2>
          <p style={P_STYLE}>We use the information we collect to:</p>
          <ul style={{ ...P_STYLE, paddingLeft: 24 }}>
            <li style={{ marginBottom: 6 }}>Provide, operate, and maintain the Service</li>
            <li style={{ marginBottom: 6 }}>Personalise your dashboard and track learning progress</li>
            <li style={{ marginBottom: 6 }}>Process payments and manage subscriptions</li>
            <li style={{ marginBottom: 6 }}>Send essential account notifications (password resets, billing alerts)</li>
            <li style={{ marginBottom: 6 }}>Detect and prevent fraud, abuse, and security incidents</li>
            <li style={{ marginBottom: 6 }}>Improve the quality of our AI coaching and interview brief content</li>
          </ul>
          <p style={P_STYLE}>We do not sell your personal data to third parties.</p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>3. Data Storage</h2>
          <p style={P_STYLE}>
            Your account data is stored in a PostgreSQL database hosted on Railway (railway.app), a US-based cloud infrastructure provider. Our web application is hosted on Vercel (vercel.com). Both providers maintain industry-standard security practices. By using Conceptra, you acknowledge that your data may be transferred to and processed in countries outside India, including the United States.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>4. Third-Party Services</h2>
          <p style={P_STYLE}><strong style={{ color: "#FDF6E3" }}>Anthropic Claude API:</strong> Your interview answers are transmitted to Anthropic&rsquo;s API for AI evaluation. Anthropic may retain API inputs per their own privacy and data retention policies. We recommend reviewing Anthropic&rsquo;s privacy policy at anthropic.com.</p>
          <p style={P_STYLE}><strong style={{ color: "#FDF6E3" }}>Razorpay:</strong> Payments are processed through Razorpay (razorpay.com), a PCI-DSS compliant payment gateway. Razorpay collects and processes your payment information under their own privacy policy.</p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>5. Cookies</h2>
          <p style={P_STYLE}>
            We use essential session cookies to keep you logged in. These cookies are strictly necessary for the Service to function and cannot be disabled. We do not use advertising or tracking cookies. You can configure your browser to reject cookies, but this may prevent you from logging in.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>6. Data Retention</h2>
          <p style={P_STYLE}>
            We retain your account data for as long as your account is active. Interview scores and interview brief progress are retained indefinitely to power your learning history. If you delete your account, we will delete your personal data within 30 days, except where retention is required by applicable law.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>7. Your Rights</h2>
          <p style={P_STYLE}>You have the right to:</p>
          <ul style={{ ...P_STYLE, paddingLeft: 24 }}>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#FDF6E3" }}>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#FDF6E3" }}>Correction:</strong> Update inaccurate or incomplete data via your account Settings page.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#FDF6E3" }}>Deletion:</strong> Request deletion of your account and associated data by emailing us.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#FDF6E3" }}>Portability:</strong> Request an export of your data in a structured format.</li>
          </ul>
          <p style={P_STYLE}>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:support@conceptra.in" style={{ color: "#F5A623", textDecoration: "none" }}>support@conceptra.in</a>. We will respond within 30 days.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>8. Contact</h2>
          <p style={P_STYLE}>
            If you have any questions, concerns, or complaints about this Privacy Policy or our data practices, please contact us at{" "}
            <a href="mailto:support@conceptra.in" style={{ color: "#F5A623", textDecoration: "none" }}>support@conceptra.in</a>.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>9. Governing Law</h2>
          <p style={P_STYLE}>
            This Privacy Policy is governed by the laws of India, including the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011. Any disputes shall be subject to the exclusive jurisdiction of Indian courts.
          </p>
        </div>
      </div>
    </main>
  );
}
