import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "#1C1917", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
    >
      <Link
        href="/"
        style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 600, color: "#F5A623", textDecoration: "none", marginBottom: 48, display: "block" }}
      >
        Conceptra
      </Link>

      <p
        style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(72px, 16vw, 120px)", fontWeight: 600, color: "#F5A623", lineHeight: 1, marginBottom: 24 }}
      >
        404
      </p>

      <h1
        style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 500, color: "#FDF6E3", marginBottom: 12 }}
      >
        This page doesn&rsquo;t exist.
      </h1>

      <p style={{ fontSize: 16, color: "#8A8073", maxWidth: 400, lineHeight: 1.6, marginBottom: 40 }}>
        You might have followed a broken link or mistyped the URL.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          style={{ padding: "13px 28px", borderRadius: 11, background: "#F5A623", color: "#1C1917", fontWeight: 700, fontSize: 15, textDecoration: "none" }}
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          style={{ padding: "13px 28px", borderRadius: 11, border: "1px solid rgba(253,246,227,0.15)", color: "#FDF6E3", fontWeight: 600, fontSize: 15, textDecoration: "none" }}
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
