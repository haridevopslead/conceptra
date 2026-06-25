export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Category =
  | "Kubernetes"
  | "CI/CD"
  | "Cloud"
  | "Infrastructure as Code"
  | "Monitoring"
  | "SRE";

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  durationMinutes: number;
  topics: string[];
  isFree: boolean;
};

export const CATEGORY_COLOR: Record<Category, string> = {
  Kubernetes: "#3B82F6",
  "CI/CD": "#8B5CF6",
  Cloud: "#06B6D4",
  "Infrastructure as Code": "#F97316",
  Monitoring: "#10B981",
  SRE: "#EF4444",
};

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Beginner: "#10B981",
  Intermediate: "#F59E0B",
  Advanced: "#EF4444",
};

export const LESSONS: Lesson[] = [
  // ── Kubernetes ──────────────────────────────────────────────────────────────
  {
    id: "k8s-1",
    slug: "docker-fundamentals",
    title: "Docker Fundamentals",
    description:
      "Master containers from the ground up: images, layers, volumes, networking, and multi-stage builds.",
    category: "Kubernetes",
    difficulty: "Beginner",
    durationMinutes: 20,
    topics: ["Dockerfile", "docker-compose", "volumes", "networking", "multi-stage builds"],
    isFree: true,
  },
  {
    id: "k8s-2",
    slug: "kubernetes-architecture",
    title: "Kubernetes Architecture Deep Dive",
    description:
      "Understand the control plane, worker nodes, etcd, kube-scheduler, and how pods are scheduled.",
    category: "Kubernetes",
    difficulty: "Intermediate",
    durationMinutes: 35,
    topics: ["control plane", "kubelet", "etcd", "kube-proxy", "pod scheduling"],
    isFree: true,
  },
  {
    id: "k8s-3",
    slug: "k8s-rbac-network-hpa",
    title: "Advanced K8s: RBAC, Network Policies & HPA",
    description:
      "Secure your cluster with RBAC, enforce traffic rules with NetworkPolicy, and auto-scale with HPA.",
    category: "Kubernetes",
    difficulty: "Advanced",
    durationMinutes: 45,
    topics: ["RBAC", "ServiceAccount", "NetworkPolicy", "HorizontalPodAutoscaler", "resource limits"],
    isFree: false,
  },

  // ── CI/CD ────────────────────────────────────────────────────────────────────
  {
    id: "cicd-1",
    slug: "github-actions-intro",
    title: "GitHub Actions from Scratch",
    description:
      "Build, test, and deploy with GitHub Actions. Covers workflows, jobs, runners, and secrets management.",
    category: "CI/CD",
    difficulty: "Beginner",
    durationMinutes: 25,
    topics: ["workflows", "jobs", "runners", "secrets", "caching", "matrix builds"],
    isFree: true,
  },
  {
    id: "cicd-2",
    slug: "jenkins-multistage-pipelines",
    title: "Multi-stage Jenkins Pipelines",
    description:
      "Write production-grade Jenkinsfiles with parallel stages, shared libraries, and Blue Ocean.",
    category: "CI/CD",
    difficulty: "Intermediate",
    durationMinutes: 30,
    topics: ["Jenkinsfile", "declarative pipeline", "shared libraries", "Blue Ocean", "agents"],
    isFree: false,
  },

  // ── Cloud ────────────────────────────────────────────────────────────────────
  {
    id: "cloud-1",
    slug: "aws-ecs-vs-eks",
    title: "AWS ECS vs EKS: Choosing the Right Container Runtime",
    description:
      "Compare ECS (Fargate & EC2) and EKS side-by-side across cost, complexity, and scaling scenarios.",
    category: "Cloud",
    difficulty: "Intermediate",
    durationMinutes: 30,
    topics: ["ECS", "EKS", "Fargate", "IAM roles", "ALB", "cost optimisation"],
    isFree: true,
  },
  {
    id: "cloud-2",
    slug: "multi-cloud-architecture",
    title: "Multi-cloud Architecture Patterns",
    description:
      "Design resilient systems that span AWS, GCP, and Azure using abstraction layers and traffic routing.",
    category: "Cloud",
    difficulty: "Advanced",
    durationMinutes: 40,
    topics: ["cloud-agnostic design", "Route 53", "GCP Load Balancing", "Azure Traffic Manager", "data residency"],
    isFree: false,
  },

  // ── Infrastructure as Code ───────────────────────────────────────────────────
  {
    id: "iac-1",
    slug: "terraform-fundamentals",
    title: "Terraform Fundamentals",
    description:
      "Provision cloud resources declaratively. Covers providers, resources, state, plan/apply lifecycle.",
    category: "Infrastructure as Code",
    difficulty: "Beginner",
    durationMinutes: 25,
    topics: ["HCL", "providers", "state file", "terraform init/plan/apply", "variables", "outputs"],
    isFree: true,
  },
  {
    id: "iac-2",
    slug: "terraform-modules-remote-state",
    title: "Terraform Modules & Remote State",
    description:
      "Reuse infrastructure code with modules and collaborate safely using S3 remote state and locking.",
    category: "Infrastructure as Code",
    difficulty: "Intermediate",
    durationMinutes: 35,
    topics: ["modules", "remote backend", "S3 + DynamoDB locking", "workspaces", "terragrunt"],
    isFree: false,
  },

  // ── Monitoring ───────────────────────────────────────────────────────────────
  {
    id: "mon-1",
    slug: "prometheus-grafana",
    title: "Prometheus & Grafana from Scratch",
    description:
      "Instrument your services, write PromQL queries, and build dashboards that actually catch outages.",
    category: "Monitoring",
    difficulty: "Intermediate",
    durationMinutes: 30,
    topics: ["PromQL", "metrics types", "alerting rules", "Grafana dashboards", "Alertmanager"],
    isFree: true,
  },
  {
    id: "mon-2",
    slug: "distributed-tracing-jaeger",
    title: "Distributed Tracing with OpenTelemetry & Jaeger",
    description:
      "Instrument microservices with OpenTelemetry, propagate context across services, and query traces.",
    category: "Monitoring",
    difficulty: "Advanced",
    durationMinutes: 35,
    topics: ["OpenTelemetry", "spans", "trace context", "Jaeger UI", "sampling strategies"],
    isFree: false,
  },

  // ── SRE ──────────────────────────────────────────────────────────────────────
  {
    id: "sre-1",
    slug: "sre-principles-slo-sla",
    title: "SRE Principles: SLOs, SLAs & Error Budgets",
    description:
      "Learn how Google SRE teams set reliability targets, measure them with SLIs, and enforce error budgets.",
    category: "SRE",
    difficulty: "Intermediate",
    durationMinutes: 30,
    topics: ["SLI", "SLO", "SLA", "error budgets", "toil", "blameless postmortems"],
    isFree: true,
  },
  {
    id: "sre-2",
    slug: "incident-management",
    title: "Incident Management & On-Call Best Practices",
    description:
      "Structure on-call rotations, run effective incident calls, and write postmortems that prevent recurrence.",
    category: "SRE",
    difficulty: "Intermediate",
    durationMinutes: 25,
    topics: ["on-call rotations", "incident commander", "communication templates", "postmortems", "runbooks"],
    isFree: false,
  },
];
