import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import TryEvaluator from "@/components/try/try-evaluator";

export const metadata = { title: "Try Conceptra — Ace Your DevOps Interview" };

export default async function TryPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/interview/practice");

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <nav
        className="flex items-center justify-between"
        style={{
          padding: "18px 20px",
          background: "var(--nav-bg-translucent)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link href="/" style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, color: "#F5A623", textDecoration: "none" }}>Conceptra</Link>
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/login" style={{ color: "var(--muted)", fontSize: 14, textDecoration: "none" }}>Sign In</Link>
          <Link href="/register" style={{ background: "#F5A623", color: "var(--accent-contrast)", fontWeight: 600, fontSize: 14, padding: "9px 18px", borderRadius: 9, textDecoration: "none" }}>Get Started</Link>
        </div>
      </nav>

      <TryEvaluator />
    </main>
  );
}
