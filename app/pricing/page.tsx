import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PricingClient from "@/components/pricing/pricing-client";

export const metadata = { title: "Pricing — Conceptra" };

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <main style={{ backgroundColor: "#1C1917", minHeight: "100vh", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ padding: "18px 24px", borderBottom: "1px solid rgba(253,246,227,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href={user ? "/dashboard" : "/"} style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, color: "#F5A623", textDecoration: "none" }}>
          Conceptra
        </Link>
        <Link href={user ? "/dashboard" : "/"} style={{ fontSize: 14, color: "#8A8073", textDecoration: "none" }}>
          {user ? "← Dashboard" : "← Home"}
        </Link>
      </nav>

      <PricingClient
        userName={user?.name ?? ""}
        userEmail={user?.email ?? ""}
        isLoggedIn={!!user}
        isPro={user?.plan === "PRO"}
      />
    </main>
  );
}
