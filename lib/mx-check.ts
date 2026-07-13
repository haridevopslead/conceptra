import dns from "dns/promises";

// Checks whether an email's domain has at least one MX (mail exchange)
// record — a free, DNS-only check with no external service.
//
// LIMITS: this catches a nonexistent or mistyped domain (e.g. "123.com",
// which has no mail routing at all) but CANNOT catch a wrong mailbox on an
// otherwise-real domain (e.g. a typo'd Gmail address like "jhon@gmail.com"
// — gmail.com has valid MX records regardless of whether that mailbox
// exists). Actually confirming a specific mailbox is reachable is what the
// verification email itself is for.
export async function domainAcceptsMail(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;

  try {
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch {
    // NXDOMAIN, no MX records, DNS timeout, etc. — treat all as "can't confirm"
    return false;
  }
}
