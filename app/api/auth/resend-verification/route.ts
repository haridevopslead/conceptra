import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

const RESEND_WINDOW_MS = 60 * 1000;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, resetAt } = checkRateLimit(`resend-verify:${session.user.id}`, 1, RESEND_WINDOW_MS);
  if (!allowed) {
    const seconds = Math.ceil((resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: `Please wait ${seconds}s before requesting another email.` },
      { status: 429 }
    );
  }

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { email: true, emailVerified: true } });
  if (!user?.email) {
    return NextResponse.json({ error: "No email on file for this account." }, { status: 400 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  try {
    const token = await createVerificationToken(user.email);
    const baseUrl = process.env.NEXTAUTH_URL ?? "https://conceptra.in";
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, verifyUrl);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[RESEND-VERIFICATION]", err);
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }
}
