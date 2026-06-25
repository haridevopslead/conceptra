import Link from "next/link";

export default function HomePage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#0A0E1A" }}
    >
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-8 py-4 border-b border-white/10">
        <span className="text-xl font-bold" style={{ color: "#F5A623" }}>
          Conceptra
        </span>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: "#F5A623", color: "#0A0E1A" }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto">
        <div
          className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-6 border"
          style={{ color: "#F5A623", borderColor: "#F5A623" }}
        >
          AI-Powered Interview Coaching
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
          Master{" "}
          <span style={{ color: "#F5A623" }}>DevOps</span>{" "}
          Interviews
        </h1>

        <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
          AI-powered coaching built by a Lead DevOps Engineer. Practice real
          interview scenarios, get instant feedback, and land your dream role.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl text-lg font-bold transition-transform hover:scale-105"
            style={{ backgroundColor: "#F5A623", color: "#0A0E1A" }}
          >
            Start Free Trial
          </Link>
          <Link
            href="/lessons"
            className="px-8 py-4 rounded-xl text-lg font-semibold text-white border border-white/20 hover:border-white/40 transition-colors"
          >
            Browse Lessons
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {[
          {
            title: "Live AI Mock Interviews",
            description:
              "Practice with an AI interviewer that mimics real DevOps hiring panels.",
          },
          {
            title: "Structured Learning Paths",
            description:
              "Curated lessons on Kubernetes, CI/CD, Cloud, and SRE practices.",
          },
          {
            title: "Instant Feedback",
            description:
              "Get detailed scores and improvement tips after every session.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl p-6 border border-white/10"
            style={{ backgroundColor: "#111827" }}
          >
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: "#F5A623" }}
            >
              {card.title}
            </h3>
            <p className="text-sm text-gray-400">{card.description}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="mt-24 pb-8 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Conceptra. All rights reserved.
      </footer>
    </main>
  );
}
