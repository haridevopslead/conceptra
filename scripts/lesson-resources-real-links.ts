// Real, verified external resource links for the 8 existing briefs.
// Every URL below was confirmed via web search to actually exist — none invented.
// Keyed by slug so Claude Code can merge these into scripts/seed-lessons.ts's
// existing lesson objects (just add/replace the `resources` field on each
// matching lesson, don't touch anything else) and re-run the upsert.

export const lessonResourcesBySlug: Record<
  string,
  { title: string; url: string; type: "docs" | "video" | "article" }[]
> = {
  "docker-fundamentals": [
    { title: "Building best practices — Docker Docs", url: "https://docs.docker.com/build/building/best-practices/", type: "docs" },
    { title: "Docker Tutorial for Beginners (Full Course) — TechWorld with Nana", url: "https://www.youtube.com/watch?v=3c-iBn73dDE", type: "video" },
  ],
  "kubernetes-architecture": [
    { title: "kube-scheduler reference — Kubernetes Docs", url: "https://kubernetes.io/docs/reference/command-line-tools-reference/kube-scheduler/", type: "docs" },
    { title: "Scheduling Framework — Kubernetes Docs", url: "https://kubernetes.io/docs/concepts/scheduling-eviction/scheduling-framework/", type: "docs" },
  ],
  "cicd-pipelines": [
    { title: "GitHub Actions documentation", url: "https://docs.github.com/en/actions", type: "docs" },
    { title: "Quickstart for GitHub Actions", url: "https://docs.github.com/en/actions/get-started/quickstart", type: "docs" },
  ],
  "aws-fundamentals": [
    { title: "Amazon VPC Documentation", url: "https://docs.aws.amazon.com/vpc/", type: "docs" },
    { title: "Identity and access management — AWS Well-Architected Framework", url: "https://docs.aws.amazon.com/wellarchitected/latest/framework/sec-iam.html", type: "docs" },
  ],
  "terraform-iac": [
    { title: "State — Terraform Docs (HashiCorp)", url: "https://developer.hashicorp.com/terraform/language/state", type: "docs" },
    { title: "Create infrastructure — Terraform Tutorial (HashiCorp)", url: "https://developer.hashicorp.com/terraform/tutorials/aws-get-started/aws-create", type: "docs" },
  ],
  "linux-fundamentals": [
    { title: "GNU Bash Reference Manual", url: "https://www.gnu.org/software/bash/manual/bash.html", type: "docs" },
    { title: "Introduction to Linux Shell and Shell Scripting — GeeksforGeeks", url: "https://www.geeksforgeeks.org/linux-unix/introduction-linux-shell-shell-scripting/", type: "article" },
  ],
  "git-version-control": [
    { title: "git-rebase — Git Docs", url: "https://git-scm.com/docs/git-rebase", type: "docs" },
    { title: "git-merge — Git Docs", url: "https://git-scm.com/docs/git-merge", type: "docs" },
  ],
  "observability-monitoring": [
    { title: "Grafana support for Prometheus — Prometheus Docs", url: "https://prometheus.io/docs/visualization/grafana/", type: "docs" },
    { title: "Get started with Grafana and Prometheus — Grafana Docs", url: "https://grafana.com/docs/grafana/latest/fundamentals/getting-started/first-dashboards/get-started-grafana-prometheus/", type: "docs" },
  ],
};
