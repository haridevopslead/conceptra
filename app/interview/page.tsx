import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import ModeSelector from "@/components/interview/mode-selector";
import VerifyEmailBanner from "@/components/dashboard/verify-email-banner";

export const metadata = { title: "Mock Interview — Conceptra" };

export default async function InterviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let emailVerified: Date | null = null;
  // Fetch fresh from DB rather than trusting the JWT — session.user.email
  // can be stale if the user just changed it via the verify-gate banner.
  let currentEmail = session.user.email;
  try {
    const dbUser = await db.user.findUnique({ where: { id: session.user.id }, select: { emailVerified: true, email: true } });
    emailVerified = dbUser?.emailVerified ?? null;
    if (dbUser?.email) currentEmail = dbUser.email;
  } catch {
    // DB unavailable — fail open rather than block practice over a transient outage
    emailVerified = new Date();
  }

  if (!emailVerified && currentEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#1C1917" }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 500, color: "#FDF6E3" }}>
              Verify your email to start practicing
            </p>
            <p style={{ color: "#8A8073", fontSize: 14.5, marginTop: 8, lineHeight: 1.6 }}>
              Quick Practice and Interview with Hari both need a verified email —
              this keeps AI mock interviews available for real learners.
            </p>
          </div>
          <VerifyEmailBanner email={currentEmail} />
        </div>
      </div>
    );
  }

  return <ModeSelector />;
}
