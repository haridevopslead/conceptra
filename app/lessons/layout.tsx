import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Sidebar from "@/components/dashboard/sidebar";
import BottomNav from "@/components/dashboard/bottom-nav";

// A handful of briefs are readable without an account (see
// lib/public-lessons.ts) — so unlike the rest of the authenticated app,
// this layout no longer hard-redirects logged-out visitors. Individual
// pages under /lessons decide what an anonymous visitor may see; this
// layout only decides which chrome wraps it.
export default async function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#1C1917" }}>
        <nav
          className="flex items-center justify-between"
          style={{
            padding: "18px 20px",
            background: "rgba(28,25,23,0.82)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid rgba(253,246,227,0.06)",
          }}
        >
          <Link href="/" style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, color: "#F5A623", textDecoration: "none" }}>Conceptra</Link>
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/login" style={{ color: "#B3A799", fontSize: 14, textDecoration: "none" }}>Sign In</Link>
            <Link href="/register" style={{ background: "#F5A623", color: "#1C1917", fontWeight: 600, fontSize: 14, padding: "9px 18px", borderRadius: 9, textDecoration: "none" }}>Get Started</Link>
          </div>
        </nav>
        <main className="w-full max-w-5xl mx-auto">{children}</main>
      </div>
    );
  }

  // Fetch plan fresh from DB so the sidebar reflects upgrades immediately
  let freshPlan = session.user.plan;
  try {
    const dbUser = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
    if (dbUser) freshPlan = dbUser.plan;
  } catch {
    // fall back to JWT plan
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#1C1917" }}>
      <Sidebar user={{ ...session.user, plan: freshPlan }} />
      <main className="flex-1 overflow-auto pb-20 md:pb-0 w-full max-w-5xl mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
