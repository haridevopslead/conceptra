import Link from "next/link";

export const metadata = { title: "Terms of Service — Conceptra" };

const SECTION_STYLE: React.CSSProperties = { marginBottom: 36 };
const H2_STYLE: React.CSSProperties = { fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 500, color: "#FDF6E3", marginBottom: 12 };
const P_STYLE: React.CSSProperties = { fontSize: 15, color: "#B3A799", lineHeight: 1.75, marginBottom: 10 };

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: 14, color: "#6E665C", marginBottom: 52 }}>Last updated: 27 June 2026</p>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>1. Acceptance of Terms</h2>
          <p style={P_STYLE}>
            By accessing or using Conceptra (&ldquo;the Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) at conceptra.in, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service. We reserve the right to update these terms at any time; continued use of the Service after changes constitutes acceptance of the revised terms.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>2. Description of Service</h2>
          <p style={P_STYLE}>
            Conceptra is an AI-powered DevOps interview coaching platform that provides structured lessons, mock interview sessions, and personalised feedback to help engineers prepare for technical interviews at Indian technology companies. The Service uses large language models to evaluate answers and generate coaching feedback.
          </p>
          <p style={P_STYLE}>
            AI-generated feedback is for educational purposes only. It does not guarantee job placement or interview success and should not be treated as professional career advice.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>3. User Accounts</h2>
          <p style={P_STYLE}>
            You must create an account to use the core features of the Service. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration and keep it updated.
          </p>
          <p style={P_STYLE}>
            You must be at least 18 years old to create an account. We reserve the right to suspend or terminate accounts that violate these Terms.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>4. Payment and Subscription</h2>
          <p style={P_STYLE}>
            Conceptra offers a free tier with limited access and a Pro subscription. Pro is priced at ₹2,999 per year (or as displayed at checkout). All prices are in Indian Rupees and inclusive of applicable taxes unless stated otherwise.
          </p>
          <p style={P_STYLE}>
            Payments are processed securely through Razorpay. We do not store your payment card details. Subscriptions renew automatically unless cancelled before the renewal date.
          </p>
          <p style={P_STYLE}>
            Refund policy: You may request a full refund within 7 days of your initial purchase if you are unsatisfied with the Service. After 7 days, no refunds will be issued. To request a refund, contact us at support@conceptra.in.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>5. Intellectual Property</h2>
          <p style={P_STYLE}>
            All content, design, code, lesson material, and AI-generated coaching output on Conceptra is owned by or licensed to us. You may not reproduce, distribute, modify, or create derivative works without our express written permission.
          </p>
          <p style={P_STYLE}>
            Your answers, responses, and interactions submitted through the Service remain your property. By submitting content, you grant us a non-exclusive licence to use it solely to provide and improve the Service.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>6. Prohibited Uses</h2>
          <p style={P_STYLE}>You agree not to:</p>
          <ul style={{ ...P_STYLE, paddingLeft: 24 }}>
            <li style={{ marginBottom: 6 }}>Use the Service for any unlawful purpose or in violation of any applicable law or regulation</li>
            <li style={{ marginBottom: 6 }}>Attempt to reverse-engineer, scrape, or extract the Service&rsquo;s content, lesson data, or AI prompts at scale</li>
            <li style={{ marginBottom: 6 }}>Share account credentials or allow others to access your account</li>
            <li style={{ marginBottom: 6 }}>Interfere with or disrupt the integrity or performance of the Service</li>
            <li style={{ marginBottom: 6 }}>Use the Service to train competing AI models or products</li>
          </ul>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>7. Disclaimer of Warranties</h2>
          <p style={P_STYLE}>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or harmful components.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>8. Limitation of Liability</h2>
          <p style={P_STYLE}>
            To the maximum extent permitted by applicable law, Conceptra and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service, even if we have been advised of the possibility of such damages. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>9. Governing Law</h2>
          <p style={P_STYLE}>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in India. If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>10. Contact</h2>
          <p style={P_STYLE}>
            If you have any questions about these Terms of Service, please contact us at{" "}
            <a href="mailto:support@conceptra.in" style={{ color: "#F5A623", textDecoration: "none" }}>support@conceptra.in</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
