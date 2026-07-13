import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.create({
      data: { name, email, hashedPassword },
    });

    // Best-effort — a failed send shouldn't fail registration itself; the
    // account still exists and the user can hit "Resend verification email."
    try {
      const token = await createVerificationToken(email);
      const baseUrl = process.env.NEXTAUTH_URL ?? "https://conceptra.in";
      const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
      await sendVerificationEmail(email, verifyUrl);
    } catch (err) {
      console.error("[REGISTER] Failed to send verification email", err);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
