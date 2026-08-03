// Keys match the Interview-with-Hari topic names exactly (app/interview/dev/page.tsx's
// TOPICS list) so a brief's category and its corresponding practice topic
// share one color identity. Terraform/Observability reuse the same colors
// their pre-rename category strings ("Infrastructure as Code"/"Monitoring")
// had; Docker and AWS are the two genuinely new entries this palette needed.
export const CATEGORY_COLOR: Record<string, string> = {
  Docker: "#6FA8C7",
  Kubernetes: "#8AA0B8",
  "CI/CD": "#A593B5",
  AWS: "#8FB0B5",
  Terraform: "#C99A6A",
  Observability: "#9CAE86",
  Linux: "#B5A88F",
  Git: "#B58F8F",
};

export const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: "#9CAE86",
  Intermediate: "#D6A24E",
  Advanced: "#C57B6B",
};

export const FALLBACK_COLOR = "#6B7280";
