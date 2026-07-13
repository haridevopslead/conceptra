// Maps Quick Practice's QUESTION_BANK topic keys (components/interview/evaluator.tsx)
// to the matching Interview Brief, so a learner stuck on a question can be
// pointed at the full brief instead of always generating a fresh explanation
// from scratch. Plain data, safe to import from both server and client code.
export const TOPIC_BRIEFS: Record<string, { slug: string; title: string }> = {
  Docker: { slug: "docker-fundamentals", title: "Docker Fundamentals" },
  Kubernetes: { slug: "kubernetes-architecture", title: "Kubernetes Architecture Deep Dive" },
  "CI/CD": { slug: "cicd-pipelines", title: "CI/CD Pipelines" },
  AWS: { slug: "aws-fundamentals", title: "AWS Fundamentals" },
  Terraform: { slug: "terraform-iac", title: "Terraform & Infrastructure as Code" },
  Linux: { slug: "linux-fundamentals", title: "Linux & Shell Scripting" },
  Git: { slug: "git-version-control", title: "Git & Version Control" },
  Observability: { slug: "observability-monitoring", title: "Observability" },
};

export function getBriefForTopic(topic?: string): { slug: string; title: string } | null {
  if (!topic) return null;
  return TOPIC_BRIEFS[topic] ?? null;
}
