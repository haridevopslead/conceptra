import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PricingClient from "@/components/pricing/pricing-client";

const PRICING_TITLE = "Pricing — Conceptra";
const PRICING_DESCRIPTION =
  "Simple pricing for DevOps interview prep. Start free with 3 AI mock interviews a month, or go Pro for unlimited practice, every interview brief, and detailed scoring.";

export const metadata = {
  title: PRICING_TITLE,
  description: PRICING_DESCRIPTION,
  openGraph: {
    title: PRICING_TITLE,
    description: PRICING_DESCRIPTION,
    url: "https://conceptra.in/pricing",
    siteName: "Conceptra",
    // Reuse the site-wide dynamic OG image (app/opengraph-image.tsx) — a
    // page-level openGraph object isn't auto-merged with it otherwise.
    images: ["/opengraph-image"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PRICING_TITLE,
    description: PRICING_DESCRIPTION,
  },
};

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <main style={{ backgroundColor: "#1C1917", minHeight: "100vh", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ padding: "18px 24px", borderBottom: "1px solid rgba(253,246,227,0.06)" }}>
        <Link href={user ? "/dashboard" : "/"} style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, color: "#F5A623", textDecoration: "none" }}>
          Conceptra
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
