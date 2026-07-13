import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// conceptra.in is verified in Resend — this must never fall back to a
// resend.dev sandbox address again. The sandbox sender only delivers to the
// Resend account owner's own email; every other recipient gets a silent
// 403 from Resend's API (the SDK resolves with { error } rather than
// throwing, so a caller that doesn't check the result never finds out).
// RESEND_FROM_EMAIL can still override this per-environment if needed.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "Conceptra <verify@conceptra.in>";

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Verify your email — Conceptra",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1C1917;">
        <h1 style="font-size: 20px; margin-bottom: 16px;">Verify your email</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #3D3530;">
          Confirm your email address to unlock AI mock interviews and Interview with Hari on Conceptra.
        </p>
        <p style="margin: 28px 0;">
          <a href="${verifyUrl}" style="background: #F5A623; color: #1C1917; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; display: inline-block;">
            Verify email address
          </a>
        </p>
        <p style="font-size: 13px; color: #8A8073; line-height: 1.6;">
          This link expires in 24 hours. If you didn't create a Conceptra account, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  // The Resend SDK resolves { data: null, error } on an API-level rejection
  // instead of throwing — surface it as a real thrown error so callers'
  // existing try/catch + console.error blocks actually see it, rather than
  // this failing completely silently (which is exactly how the sandbox
  // "from" address bug went undetected).
  if (error) {
    throw new Error(`Resend rejected the send: [${error.name}] ${error.message}`);
  }
}
