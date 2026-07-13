import crypto from "crypto";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Reuses the VerificationToken model NextAuth's PrismaAdapter already
// provides (normally used by email/magic-link providers) — this project
// only has a Credentials provider, so the table was otherwise unused.
export async function createVerificationToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  // Invalidate any previous outstanding token for this email so old links
  // in old emails stop working once a new one is issued.
  await db.verificationToken.deleteMany({ where: { identifier: email } });
  await db.verificationToken.create({
    data: { identifier: email, token, expires: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  return token;
}

// Returns the email the token was issued for, or null if the token is
// missing/expired. Always deletes the token on lookup — single use.
export async function consumeVerificationToken(token: string): Promise<string | null> {
  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record) return null;

  await db.verificationToken.delete({ where: { token } }).catch(() => {
    // already consumed by a concurrent request — fine, just don't double-apply
  });

  if (record.expires < new Date()) return null;
  return record.identifier;
}
