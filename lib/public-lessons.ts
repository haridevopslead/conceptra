// Briefs readable without an account — the SEO/audit-driven exception to the
// normal login gate on /lessons. Deliberately a separate list from the
// tier === "FREE" gate (which controls logged-in Pro-vs-Free access): a
// slug listed here must ALSO be tier "FREE" in the DB, or a logged-in Free
// user would see it locked while an anonymous visitor sees it open.
export const PUBLIC_LESSON_SLUGS = [
  "docker-fundamentals",
  "kubernetes-architecture",
  "cicd-pipelines",
] as const;

export function isPublicLesson(slug: string): boolean {
  return (PUBLIC_LESSON_SLUGS as readonly string[]).includes(slug);
}
