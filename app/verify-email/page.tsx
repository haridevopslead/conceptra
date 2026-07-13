import Link from "next/link";
import { db } from "@/lib/db";
import { consumeVerificationToken } from "@/lib/verification";

export const metadata = { title: "Verify Email — Conceptra" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  let status: "success" | "invalid" | "error" = "invalid";

  if (token) {
    try {
      const email = await consumeVerificationToken(token);
      if (email) {
        await db.user.update({
          where: { email },
          data: { emailVerified: new Date() },
        });
        status = "success";
      } else {
        status = "invalid";
      }
    } catch (err) {
      console.error("[VERIFY-EMAIL]", err);
      status = "error";
    }
  }

  const copy = {
    success: {
      heading: "Email verified",
      body: "You're all set — AI mock interviews and Interview with Hari are unlocked.",
    },
    invalid: {
      heading: "Link expired or already used",
      body: "This verification link isn't valid anymore. Sign in and use \"Resend verification email\" from your dashboard to get a new one.",
    },
    error: {
      heading: "Something went wrong",
      body: "We couldn't verify your email right now. Please try again in a moment.",
    },
  }[status];

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#1C1917" }}
    >
      <div className="w-full max-w-md text-center">
        <Link href="/" style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 600, color: "#F5A623", textDecoration: "none" }}>
          Conceptra
        </Link>

        <div
          className="rounded-2xl border border-white/10 p-8 mt-8"
          style={{ backgroundColor: "#2C2420" }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>{status === "success" ? "✓" : status === "invalid" ? "⚠" : "✗"}</div>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 24, fontWeight: 500, color: "#FDF6E3", marginBottom: 10 }}>
            {copy.heading}
          </h1>
          <p style={{ color: "#B3A799", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            {copy.body}
          </p>
          <Link
            href={status === "success" ? "/interview" : "/dashboard"}
            className="inline-block font-bold text-sm"
            style={{ background: "#F5A623", color: "#1C1917", padding: "12px 24px", borderRadius: 10, textDecoration: "none" }}
          >
            {status === "success" ? "Start practicing →" : "Go to dashboard"}
          </Link>
        </div>
      </div>
    </main>
  );
}
