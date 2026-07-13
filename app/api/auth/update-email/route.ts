import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { domainAcceptsMail } from "@/lib/mx-check";

const WINDOW_MS = 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lets an unverified user correct a typo'd/wrong email before they've ever
// confirmed it. Once emailVerified is set, this route refuses — changing a
// confirmed email is a different, out-of-scope feature.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, resetAt } = checkRateLimit(`update-email:${session.user.id}`, 1, WINDOW_MS);
  if (!allowed) {
    const seconds = Math.ceil((resetAt - Date.now()) / 1000);
    return NextResponse.json({ error: `Please wait ${seconds}s before trying again.` }, { status: 429 });
  }

  const { email } = await req.json();
  const newEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!newEmail || !EMAIL_RE.test(newEmail)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { email: true, emailVerified: true } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: "Your email is already verified and can't be changed here." }, { status: 403 });
  }
  if (newEmail === user.email) {
    return NextResponse.json({ error: "That's already your current email." }, { status: 400 });
  }

  const taken = await db.user.findUnique({ where: { email: newEmail } });
  if (taken) {
    return NextResponse.json({ error: "That email is already in use by another account." }, { status: 409 });
  }

  if (!(await domainAcceptsMail(newEmail))) {
    return NextResponse.json(
      { error: "This email domain doesn't appear to accept mail — double-check for a typo." },
      { status: 400 }
    );
  }

  try {
    // Old outstanding tokens were issued under the old email identifier —
    // they're meaningless once the address changes, so clear them alongside
    // the update itself.
    await db.$transaction([
      db.verificationToken.deleteMany({ where: { identifier: user.email ?? undefined } }),
      db.user.update({ where: { id: session.user.id }, data: { email: newEmail } }),
    ]);

    const token = await createVerificationToken(newEmail);
    const baseUrl = process.env.NEXTAUTH_URL ?? "https://conceptra.in";
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
    await sendVerificationEmail(newEmail, verifyUrl);

    return NextResponse.json({ ok: true, email: newEmail });
  } catch (err) {
    console.error("[UPDATE-EMAIL]", err);
    return NextResponse.json({ error: "Failed to update email. Please try again." }, { status: 500 });
  }
}
