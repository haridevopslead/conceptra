import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's shared sandbox sender — works without verifying a custom domain,
// but only delivers to the email address the Resend account itself is
// registered with. Swap to a verified "you@yourdomain.com" once a domain is
// added in the Resend dashboard.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "Conceptra <onboarding@resend.dev>";

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  await resend.emails.send({
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
}
