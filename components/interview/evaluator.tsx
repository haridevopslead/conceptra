"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SeniorAnswerBox, { RichText } from "./senior-answer-box";
import CompareAnswer from "./compare-answer";
import MicButton from "./mic-button";
import { useVoiceRecorder } from "./use-voice-recorder";
import { getBriefForTopic } from "@/lib/interview/topic-briefs";

// ── Question bank ─────────────────────────────────────────────────────────────

const QUESTION_BANK: Record<string, string[]> = {
  Docker: [
    "What is the difference between a Docker image and a container? How would you explain this to a junior engineer joining your team?",
    "Walk me through what happens when you run `docker build -t myapp .` — from Dockerfile parsing to the final image.",
    "What is a multi-stage Docker build and when would you use one? Give a real example.",
    "Your container is OOMKilling in production. How do you investigate and fix it?",
    "Explain Docker layer caching. How would you structure a Dockerfile to maximize cache hits during CI builds?",
    "What is the difference between COPY and ADD in a Dockerfile? What are the security implications of each?",
    "Explain Docker networking modes — bridge, host, and overlay. When would you choose each?",
  ],
  Kubernetes: [
    "Your Kubernetes pod is stuck in CrashLoopBackOff. Walk me through exactly how you debug it in production.",
    "What is the difference between a Deployment and a StatefulSet? When would you use each?",
    "Explain Kubernetes resource requests vs limits. What happens if a pod exceeds its memory limit?",
    "How does the Kubernetes scheduler decide which node to place a pod on? What mechanisms can you use to influence placement?",
    "What is a Kubernetes Ingress and how does it differ from a Service of type LoadBalancer?",
    "Walk me through how you would perform a zero-downtime rolling deployment in Kubernetes.",
    "What is a PodDisruptionBudget and when would you use one?",
  ],
  "CI/CD": [
    "How would you design a zero-downtime deployment pipeline for a service that requires a database schema migration?",
    "Explain the difference between a blue-green deployment and a canary deployment. When would you use each?",
    "What is the difference between continuous delivery and continuous deployment? Which should teams aim for?",
    "Your CI pipeline takes 45 minutes. Walk me through how you would optimize it.",
    "How would you handle secret management in a CI/CD pipeline safely?",
    "What is a feature flag and how does it complement CI/CD practices?",
    "Describe how you would implement a rollback strategy for a failed deployment.",
  ],
  AWS: [
    "What is the difference between an IAM role and an IAM policy? How do you follow least-privilege principles?",
    "Explain the difference between SQS and SNS. When would you use each or combine them?",
    "How would you design a highly available, multi-region architecture for a critical API?",
    "Explain VPC peering vs Transit Gateway — what are the limits and cost implications of each?",
    "Your EC2 costs doubled this month unexpectedly. Walk me through how you'd investigate and reduce them.",
    "What is the difference between ECS and EKS? When would you choose one over the other?",
    "Explain S3 storage classes. How would you design a lifecycle policy for logs that must be retained for 7 years?",
  ],
  Terraform: [
    "What is Terraform state and why is it important? What are the risks of losing it?",
    "Explain the difference between `terraform plan` and `terraform apply`. What can go wrong if you skip plan?",
    "What are Terraform modules? How would you structure a module for a reusable VPC component?",
    "How do you manage secrets in Terraform? What approaches should you avoid?",
    "Explain Terraform workspaces vs directory-based environment separation. Which do you prefer and why?",
    "What happens when two engineers run `terraform apply` simultaneously? How do you prevent it?",
    "How would you import existing AWS infrastructure into Terraform without destroying it?",
  ],
  Linux: [
    "Walk me through what happens when you run a command in the Linux shell — from pressing Enter to process creation.",
    "A Linux server is unresponsive but you can still SSH in. How do you diagnose what's consuming all resources?",
    "Explain the difference between a hard link and a soft link. When would you use each?",
    "What is the difference between `kill`, `kill -9`, and `killall`? What are the risks of using SIGKILL?",
    "How does Linux memory management work? Explain the difference between free, cached, and used memory in `htop`.",
    "Explain Linux file permissions. What does `chmod 644` mean and how does `setuid` work?",
    "Your Linux server's disk is full but `df -h` and `du -sh *` don't add up. How do you find the missing space?",
  ],
  Git: [
    "Explain the difference between `git merge` and `git rebase`. When would you use each on a team?",
    "What is the difference between `git reset`, `git revert`, and `git restore`? When is each appropriate?",
    "Walk me through what happens during a `git pull` — from network fetch to working tree update.",
    "What is a Git hook and how would you use one to enforce commit message standards?",
    "You accidentally committed secrets to main and pushed. Walk me through the full remediation process.",
    "Explain trunk-based development vs Gitflow. Which would you recommend for a team shipping 10 times a day?",
    "What is `git bisect` and how would you use it to find a regression introduced in the last 200 commits?",
  ],
  Observability: [
    "What is the difference between metrics, logs, and traces? When do you need each?",
    "Explain the RED method and the USE method for measuring service health. When do you apply each?",
    "Your SLO is breaching but all your dashboards look healthy. How do you debug this discrepancy?",
    "What is distributed tracing? How would you add it to a microservice that currently has none?",
    "Explain cardinality in metrics. What happens to Prometheus when you have high-cardinality labels?",
    "How would you design an alerting strategy that minimizes both false positives and missed incidents?",
    "What is an error budget and how would you explain burn rate to a non-technical stakeholder?",
  ],
};

const TOPIC_META: Record<string, { code: string; desc: string }> = {
  Docker:        { code: "DO", desc: "Containers & images" },
  Kubernetes:    { code: "K8", desc: "Orchestration & scheduling" },
  "CI/CD":       { code: "CD", desc: "Pipelines & deployments" },
  AWS:           { code: "AW", desc: "Cloud infrastructure" },
  Terraform:     { code: "TF", desc: "Infrastructure as Code" },
  Linux:         { code: "LX", desc: "Systems & shell" },
  Git:           { code: "GT", desc: "Version control" },
  Observability: { code: "OB", desc: "Metrics, logs & traces" },
};

const DIFFICULTIES = ["Beginner", "Intermediate", "Senior"] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "idle" | "submitting" | "done";

type EvalResult = {
  overall_score: number;
  depth_score: number;
  accuracy_score: number;
  production_awareness_score: number;
  what_was_strong: string;
  what_was_weak: string;
  direct_answer: string;
  concrete_example: string;
  senior_insight: string;
  // True only for an honest "I don't know" — never for a merely weak/wrong
  // attempt. Drives the concept-explanation card below instead of the usual
  // punitive-reading score treatment.
  is_dont_know: boolean;
  concept_explanation: string;
  // Present when the DB write succeeded — null if persistence failed, in
  // which case the bookmark button just doesn't render for this result.
  sessionId: string | null;
  bookmarked: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(n: number) {
  if (n >= 8) return "#F5A623";
  if (n >= 6) return "#10B981";
  if (n >= 4) return "#F59E0B";
  return "#EF4444";
}

function scoreLabel(n: number) {
  if (n >= 8) return "Excellent";
  if (n >= 6) return "Good";
  if (n >= 4) return "Needs Work";
  return "Keep Practicing";
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function BookmarkIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M6 2a2 2 0 0 0-2 2v18l8-6 8 6V4a2 2 0 0 0-2-2H6z" />
    </svg>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SubScore({ label, score }: { label: string; score: number }) {
  const color = scoreColor(score);
  return (
    <div
      className="flex flex-col items-center px-3 py-3 rounded-xl border"
      style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
    >
      <span className="text-xl font-black" style={{ color }}>
        {score}
        <span className="text-sm font-medium text-gray-500">/10</span>
      </span>
      <span className="text-[11px] text-gray-400 mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

function ResultBox({
  color, bg, border, icon, label, body,
}: {
  color: string; bg: string; border: string; icon: string; label: string; body: string;
}) {
  return (
    <div className="rounded-xl border p-5 space-y-2" style={{ backgroundColor: bg, borderColor: border }}>
      <p className="text-xs font-bold tracking-wider" style={{ color }}>{icon} {label}</p>
      <RichText text={body} />
    </div>
  );
}

// Shown instead of a punitive score treatment when the answer was an honest
// "I don't know" — leads the results so it reads as a teaching moment, not
// just another (low) score. Matches the brief detail page's CONCEPT color.
function ConceptExplanationCard({ topic, explanation }: { topic: string | null; explanation: string }) {
  const brief = getBriefForTopic(topic ?? undefined);
  return (
    <div
      className="rounded-2xl border p-6 space-y-3"
      style={{ backgroundColor: "rgba(59,130,246,0.06)", borderColor: "rgba(59,130,246,0.25)", borderLeft: "3px solid #3B82F6" }}
    >
      <p className="text-xs font-bold tracking-widest" style={{ color: "#3B82F6" }}>
        📘 LET&apos;S COVER THE CONCEPT
      </p>
      <RichText text={explanation} />
      {brief && (
        <Link
          href={`/lessons/${brief.slug}#concept`}
          className="inline-block text-sm font-semibold hover:underline"
          style={{ color: "#3B82F6" }}
        >
          Want the full breakdown? Read the {brief.title} brief →
        </Link>
      )}
    </div>
  );
}

// ── Go deeper with Hari ──────────────────────────────────────────────────────────

type DevHandoffContext = {
  topic: string;
  difficulty: string;
  question: string;
  answer: string;
  seniorInsight: string;
};

// Must match HANDOFF_KEY in app/interview/dev/page.tsx. sessionStorage, not a
// DB write — a one-time context handoff into the stateless Hari chat flow.
const DEV_HANDOFF_KEY = "devHandoffContext";

function GoDeeperButton({ ctx }: { ctx: DevHandoffContext }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        sessionStorage.setItem(DEV_HANDOFF_KEY, JSON.stringify(ctx));
        router.push("/interview/dev");
      }}
      className="w-full py-3 rounded-xl font-semibold text-sm border transition-colors hover:bg-white/5"
      style={{ borderColor: "rgba(245,166,35,0.35)", color: "#F5A623", background: "transparent" }}
    >
      Ask Hari to go deeper on this →
    </button>
  );
}

// ── Bookmark toggle ──────────────────────────────────────────────────────────────

// Controlled by the parent (not local state) so the correct saved/unsaved
// state survives navigating away and back via QuestionNav's review mode.
function BookmarkButton({
  sessionId, bookmarked, onToggle,
}: {
  sessionId: string | null; bookmarked: boolean; onToggle: (next: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);

  // Persistence failed for this result server-side — nothing to bookmark.
  if (!sessionId) return null;

  async function toggle() {
    if (saving) return;
    const next = !bookmarked;
    onToggle(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/interview/sessions/${sessionId}/bookmark`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarked: next }),
      });
      if (!res.ok) onToggle(!next);
    } catch {
      onToggle(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      aria-label={bookmarked ? "Remove bookmark" : "Save this answer for later review"}
      aria-pressed={bookmarked}
      title={bookmarked ? "Saved for review" : "Save for review"}
      className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors disabled:opacity-50 shrink-0"
      style={{
        color: bookmarked ? "#F5A623" : "#8A8073",
        background: bookmarked ? "rgba(245,166,35,0.12)" : "transparent",
      }}
    >
      <BookmarkIcon filled={bookmarked} className="w-[18px] h-[18px]" />
    </button>
  );
}

// ── Question nav ──────────────────────────────────────────────────────────────

function QuestionNav({
  total,
  completedCount,
  viewIndex,
  onView,
}: {
  total: number;
  completedCount: number;
  viewIndex: number | null;
  onView: (i: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < completedCount;
        const isActive = i === completedCount;
        const isFuture = i > completedCount;
        const isSelected = viewIndex === null ? isActive : i === viewIndex;

        return (
          <button
            key={i}
            disabled={isFuture}
            onClick={() => {
              if (isDone) onView(i);
              else if (isActive) onView(null);
            }}
            className="text-xs font-bold px-2.5 py-1 rounded-lg transition-all"
            style={{
              backgroundColor: isSelected
                ? "#F5A623"
                : isDone
                ? "rgba(16,185,129,0.12)"
                : isActive
                ? "rgba(245,166,35,0.08)"
                : "#211C18",
              color: isSelected
                ? "#1C1917"
                : isDone
                ? "#10B981"
                : isActive
                ? "#F5A623"
                : "#374151",
              border: isSelected
                ? "none"
                : isDone
                ? "1px solid rgba(16,185,129,0.25)"
                : isActive
                ? "1px solid rgba(245,166,35,0.25)"
                : "1px solid rgba(255,255,255,0.05)",
              cursor: isFuture ? "not-allowed" : "pointer",
            }}
          >
            Q{i + 1}
          </button>
        );
      })}
      <span className="text-xs text-gray-600 ml-1">
        {completedCount}/{total} done
      </span>
    </div>
  );
}

// ── Topic selector screen ─────────────────────────────────────────────────────

function TopicSelector({ onStart }: { onStart: (topic: string, difficulty: string) => void }) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState("Intermediate");

  return (
    <div className="interview-page p-4 sm:p-8 w-full max-w-[860px] space-y-8">
      <div>
        <p className="text-xs font-bold tracking-widest" style={{ color: "#F5A623", letterSpacing: "0.22em", textTransform: "uppercase" }}>Today&apos;s coaching session</p>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(26px, 6vw, 38px)", fontWeight: 500, color: "#FDF6E3", letterSpacing: "-0.01em", marginTop: 14 }}>Choose your focus for today</h1>
        <p className="text-sm mt-2.5 max-w-lg leading-relaxed" style={{ color: "#C9BFB2" }}>
          Pick a topic and difficulty. Your coach will ask seven questions and give honest, specific feedback — the way a senior engineer would.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Topic</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(TOPIC_META).map(([id, meta]) => {
            const isSelected = selectedTopic === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedTopic(id)}
                className="flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all"
                style={{
                  backgroundColor: isSelected ? "rgba(245,166,35,0.1)" : "#2C2420",
                  borderColor: isSelected ? "#F5A623" : "rgba(253,246,227,0.07)",
                }}
              >
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,166,35,0.14)", color: "#F5A623" }}>{meta.code}</span>
                <div style={{ minHeight: 40 }}>
                  <p style={{ fontSize: 14, fontFamily: "'Newsreader', serif", fontWeight: 500, color: isSelected ? "#F5A623" : "#FDF6E3" }}>{id}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#8A8073" }}>{meta.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Difficulty</p>
        <div className="flex gap-3">
          {DIFFICULTIES.map((d) => {
            const isSelected = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{
                  backgroundColor: isSelected ? "rgba(245,166,35,0.1)" : "#211C18",
                  borderColor: isSelected ? "#F5A623" : "rgba(255,255,255,0.1)",
                  color: isSelected ? "#F5A623" : "#9CA3AF",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => selectedTopic && onStart(selectedTopic, difficulty)}
        disabled={!selectedTopic}
        className="w-full py-4 rounded-xl font-bold text-sm transition-all"
        style={{
          backgroundColor: selectedTopic ? "#F5A623" : "#2D2A1F",
          color: selectedTopic ? "#1C1917" : "#6B5E2A",
          border: selectedTopic ? "none" : "1px solid rgba(245,166,35,0.15)",
          cursor: selectedTopic ? "pointer" : "not-allowed",
        }}
      >
        {selectedTopic ? `Start ${selectedTopic} Interview →` : "Select a topic to begin"}
      </button>
    </div>
  );
}

// ── Session summary screen ────────────────────────────────────────────────────

type SessionScore = {
  depth: number;
  accuracy: number;
  production: number;
  overall: number;
};

type HistoryEntry = {
  question: string;
  answer: string;
  result: EvalResult;
};

// ── In-progress session persistence ─────────────────────────────────────────
// So navigating away mid-session (e.g. "Ask Hari to go deeper") and coming
// back — via that screen's link, browser Back, or a fresh mount — resumes
// exactly where the user left off, not just at the right question index but
// with prior answers/scores intact. sessionStorage, not a DB write.

type PersistedSession = {
  topic: string;
  difficulty: string;
  qIndex: number;
  history: HistoryEntry[];
  sessionScores: SessionScore[];
};

const QUICK_PRACTICE_KEY = "quickPracticeSession";

function persistSession(session: PersistedSession) {
  try {
    sessionStorage.setItem(QUICK_PRACTICE_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage unavailable (private browsing / quota) — resume just
    // won't work, not worth failing the session over.
  }
}

function clearPersistedSession() {
  try {
    sessionStorage.removeItem(QUICK_PRACTICE_KEY);
  } catch {
    // ignore
  }
}

function SessionSummary({
  scores,
  onRestart,
  topic,
  difficulty,
}: {
  scores: SessionScore[];
  onRestart: () => void;
  topic: string;
  difficulty: string;
}) {
  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const avgOverall = avg(scores.map((s) => s.overall));
  const avgDepth = avg(scores.map((s) => s.depth));
  const avgAccuracy = avg(scores.map((s) => s.accuracy));
  const avgProduction = avg(scores.map((s) => s.production));

  const dims = [
    { label: "Depth", val: avgDepth },
    { label: "Accuracy", val: avgAccuracy },
    { label: "Production Awareness", val: avgProduction },
  ];
  const strongest = dims.reduce((a, b) => (b.val > a.val ? b : a));
  const weakest = dims.reduce((a, b) => (b.val < a.val ? b : a));

  return (
    <div className="p-4 sm:p-8 w-full max-w-[860px] space-y-6">
      {/* Heading */}
      <div className="text-center space-y-2">
        <div className="text-5xl">🎉</div>
        <h1 className="text-3xl font-black text-white">Session Complete!</h1>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(245,166,35,0.12)", color: "#F5A623" }}>{topic}</span>
          <span className="text-xs text-gray-500 px-2.5 py-1 rounded-full" style={{ backgroundColor: "#2C2420" }}>{difficulty}</span>
          <span className="text-xs text-gray-500 px-2.5 py-1 rounded-full" style={{ backgroundColor: "#2C2420" }}>{scores.length} questions</span>
        </div>
      </div>

      {/* Big score */}
      <div
        className="rounded-2xl border border-white/10 p-8 text-center space-y-2"
        style={{ backgroundColor: "#211C18" }}
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Average Score</p>
        <div className="text-6xl font-black mt-1" style={{ color: scoreColor(avgOverall) }}>
          {avgOverall}
          <span className="text-3xl font-bold text-gray-500">/10</span>
        </div>
        <p className="text-lg font-semibold mt-1" style={{ color: scoreColor(avgOverall) }}>
          {scoreLabel(avgOverall)}
        </p>
      </div>

      {/* Dimension breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {dims.map((d) => (
          <SubScore key={d.label} label={d.label} score={d.val} />
        ))}
      </div>

      {/* Strongest / Weakest */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          className="rounded-xl border p-5 space-y-1"
          style={{ backgroundColor: "rgba(16,185,129,0.07)", borderColor: "rgba(16,185,129,0.2)" }}
        >
          <p className="text-xs font-bold tracking-wider" style={{ color: "#10B981" }}>
            ✓ STRONGEST DIMENSION
          </p>
          <p className="text-base font-bold text-white">{strongest.label}</p>
          <p className="text-sm text-gray-400">Avg {strongest.val}/10 — this is your confidence zone</p>
        </div>
        <div
          className="rounded-xl border p-5 space-y-1"
          style={{ backgroundColor: "rgba(239,68,68,0.07)", borderColor: "rgba(239,68,68,0.2)" }}
        >
          <p className="text-xs font-bold tracking-wider" style={{ color: "#EF4444" }}>
            ⚠ WEAKEST DIMENSION
          </p>
          <p className="text-base font-bold text-white">{weakest.label}</p>
          <p className="text-sm text-gray-400">Avg {weakest.val}/10 — focus your next study session here</p>
        </div>
      </div>

      {/* Per-question scores */}
      <div
        className="rounded-xl border border-white/10 overflow-hidden"
        style={{ backgroundColor: "#211C18" }}
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 border-b border-white/5">
          Question breakdown
        </p>
        {scores.map((s, i) => {
          const color = scoreColor(s.overall);
          return (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0"
            >
              <span className="text-sm text-gray-400">Question {i + 1}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{s.depth}/{s.accuracy}/{s.production}</span>
                <span
                  className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {s.overall}/10
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#F5A623", color: "#1C1917" }}
        >
          Start New Session
        </button>
        <Link
          href="/dashboard"
          className="flex-1 py-3.5 rounded-xl font-bold text-sm text-center border border-white/20 text-white hover:border-white/40 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Evaluator() {
  const [topic, setTopic] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState("");
  const [sessionScores, setSessionScores] = useState<SessionScore[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [checkingResume, setCheckingResume] = useState(true);
  // Whether the textarea currently holds a rough live Web Speech caption
  // (dimmed/italic) rather than the accurate Groq transcript or typed text.
  const [isLiveText, setIsLiveText] = useState(false);
  const baseAnswerRef = useRef("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Set right before a voice-driven setAnswer() so the effect below knows to
  // follow the caret — plain typing already scrolls natively and shouldn't
  // be hijacked mid-edit.
  const voiceUpdateRef = useRef(false);
  // Pasting defeats the point of practicing a real interview, where you
  // can't paste in a prepared answer — blocked on the textarea, surfaced
  // briefly here rather than silently eaten.
  const [pasteBlocked, setPasteBlocked] = useState(false);
  const pasteBlockedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pasteBlockedTimeoutRef.current) clearTimeout(pasteBlockedTimeoutRef.current);
    };
  }, []);

  function blockPaste(e: React.ClipboardEvent<HTMLTextAreaElement> | React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    setPasteBlocked(true);
    if (pasteBlockedTimeoutRef.current) clearTimeout(pasteBlockedTimeoutRef.current);
    pasteBlockedTimeoutRef.current = setTimeout(() => setPasteBlocked(false), 3000);
  }

  const questions = topic ? (QUESTION_BANK[topic] ?? []) : [];
  const question = questions[qIndex] ?? "";
  const isLast = qIndex === questions.length - 1;

  // Resume an in-progress session on mount, before TopicSelector would
  // otherwise show. Any malformed/stale data (old app version, corrupted
  // JSON) falls back to a normal fresh start instead of crashing.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(QUICK_PRACTICE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedSession;
        const totalQuestions = QUESTION_BANK[parsed.topic]?.length ?? 0;
        const shapeValid =
          typeof parsed.topic === "string" &&
          totalQuestions > 0 &&
          typeof parsed.qIndex === "number" &&
          parsed.qIndex >= 0 &&
          Array.isArray(parsed.history) &&
          Array.isArray(parsed.sessionScores);

        if (shapeValid && parsed.qIndex < totalQuestions) {
          // Normal case: resume mid-session at the next unanswered question.
          setTopic(parsed.topic);
          setDifficulty(parsed.difficulty || "Intermediate");
          setQIndex(parsed.qIndex);
          setHistory(parsed.history);
          setSessionScores(parsed.sessionScores);
        } else if (shapeValid && parsed.sessionScores.length >= totalQuestions) {
          // All questions were already scored (e.g. clicked "Ask Hari" right
          // after the 7th answer, before "See Session Results") — show the
          // summary instead of silently losing a completed session.
          setTopic(parsed.topic);
          setDifficulty(parsed.difficulty || "Intermediate");
          setHistory(parsed.history);
          setSessionScores(parsed.sessionScores);
          setSessionDone(true);
          clearPersistedSession();
        } else {
          clearPersistedSession();
        }
      }
    } catch {
      clearPersistedSession();
    }
    setCheckingResume(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Voice input ──────────────────────────────────────────────────────────────
  // A best-effort Web Speech API layer shows rough live captions while
  // speaking (appended to whatever answer text existed before this recording
  // started); the moment the accurate Groq Whisper transcript comes back on
  // stop, it fully replaces that rough text — never appended alongside it.

  function handleLiveText(liveTranscript: string) {
    setIsLiveText(true);
    voiceUpdateRef.current = true;
    setAnswer(baseAnswerRef.current ? `${baseAnswerRef.current} ${liveTranscript}` : liveTranscript);
  }

  function handleFinalText(finalTranscript: string) {
    setIsLiveText(false);
    voiceUpdateRef.current = true;
    setAnswer(baseAnswerRef.current ? `${baseAnswerRef.current} ${finalTranscript}` : finalTranscript);
  }

  // Auto-grow the textarea to fit its content (typing or voice) instead of
  // staying a fixed size with hidden overflow — reset to auto so
  // scrollHeight reflects the true content height, then apply it; the
  // maxHeight/overflowY inline style below caps the growth and switches to
  // internal scrolling beyond that. Speech recognition appends text
  // programmatically with no native caret/keystroke event, so once at that
  // cap we also force-follow the latest text ourselves.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    if (voiceUpdateRef.current) {
      el.scrollTop = el.scrollHeight;
      voiceUpdateRef.current = false;
    }
  }, [answer]);

  const {
    micState,
    error: voiceError,
    toggleMic,
    cancelRecording,
  } = useVoiceRecorder("/api/interview/transcribe", handleLiveText, handleFinalText);

  // Groq failed after live captions already showed rough text — that rough
  // text is the best we have, so stop flagging it as a placeholder.
  useEffect(() => {
    if (voiceError) setIsLiveText(false);
  }, [voiceError]);

  function handleMicToggle() {
    if (micState === "idle") {
      baseAnswerRef.current = answer;
      setIsLiveText(true);
    }
    toggleMic();
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function submit() {
    if (!answer.trim() || phase !== "idle" || micState !== "idle") return;
    cancelRecording();
    setIsLiveText(false);
    setPhase("submitting");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, topic: topic ?? "General DevOps", difficulty }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `Evaluation failed (${res.status}). Please try again.`);
        setPhase("idle");
        return;
      }
      // A freshly-submitted answer is never already bookmarked.
      const scoredResult: EvalResult = { ...data, bookmarked: false };
      setResult(scoredResult);
      const newScore: SessionScore = {
        overall: data.overall_score,
        depth: data.depth_score,
        accuracy: data.accuracy_score,
        production: data.production_awareness_score,
      };
      const newScores = [...sessionScores, newScore];
      setSessionScores(newScores);
      setPhase("done");

      // Persist as though this question were already advanced past, so
      // navigating away right now (e.g. "Ask Hari to go deeper," before
      // clicking "Next Question") resumes at the *next* question with this
      // one already recorded — not re-asking the same question.
      if (topic) {
        persistSession({
          topic,
          difficulty,
          qIndex: qIndex + 1,
          history: [...history, { question, answer, result: scoredResult }],
          sessionScores: newScores,
        });
      }
    } catch {
      setError("Evaluation failed. Please check your connection and try again.");
      setPhase("idle");
    }
  }

  // ── Next question / session end ─────────────────────────────────────────────

  function next() {
    cancelRecording();
    setIsLiveText(false);
    baseAnswerRef.current = "";
    const r = result;
    if (r) setHistory((prev) => [...prev, { question, answer, result: r }]);
    if (isLast) {
      setSessionDone(true);
      // Session complete — don't let a finished session be "resumed" later.
      clearPersistedSession();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setQIndex((i) => i + 1);
    setAnswer("");
    setResult(null);
    setPhase("idle");
    setError("");
    setViewIndex(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restart() {
    cancelRecording();
    setIsLiveText(false);
    baseAnswerRef.current = "";
    clearPersistedSession();
    setTopic(null);
    setDifficulty("Intermediate");
    setHistory([]);
    setViewIndex(null);
    setQIndex(0);
    setAnswer("");
    setResult(null);
    setPhase("idle");
    setError("");
    setSessionScores([]);
    setSessionDone(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  // Avoid flashing TopicSelector while we check for a resumable session
  if (checkingResume) return null;

  if (!topic) {
    return (
      <TopicSelector
        onStart={(t, d) => {
          setTopic(t);
          setDifficulty(d);
          persistSession({ topic: t, difficulty: d, qIndex: 0, history: [], sessionScores: [] });
        }}
      />
    );
  }

  if (sessionDone) {
    return <SessionSummary scores={sessionScores} onRestart={restart} topic={topic} difficulty={difficulty} />;
  }

  const headerBlock = (
    <div className="interview-header flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">AI Mock Interview</h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(245,166,35,0.12)", color: "#F5A623" }}>{topic}</span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "#2C2420", color: "#9CA3AF" }}>{difficulty}</span>
          <button onClick={restart} className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline">Change</button>
        </div>
      </div>
    </div>
  );

  if (viewIndex !== null && history[viewIndex]) {
    const entry = history[viewIndex];
    const r = entry.result;
    return (
      <div className="p-4 sm:p-8 w-full max-w-[860px] space-y-6">
        {headerBlock}
        <QuestionNav total={questions.length} completedCount={history.length} viewIndex={viewIndex} onView={setViewIndex} />

        {/* Reviewed question */}
        <div className="rounded-2xl border border-white/10 p-6 space-y-2" style={{ backgroundColor: "#211C18", borderLeft: "3px solid #10B981" }}>
          <p className="text-xs font-bold tracking-widest" style={{ color: "#10B981" }}>
            QUESTION {viewIndex + 1} OF {questions.length} · REVIEW
          </p>
          <p className="text-base font-medium text-white leading-relaxed">{entry.question}</p>
        </div>

        {/* Read-only answer */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Answer</label>
          <div
            className="w-full rounded-xl px-4 py-3 text-sm text-gray-300 border border-white/10 leading-relaxed whitespace-pre-wrap min-h-[80px]"
            style={{ backgroundColor: "#211C18" }}
          >
            {entry.answer}
          </div>
        </div>

        {/* Concept explanation — same as the fresh result view */}
        {r.is_dont_know && (
          <ConceptExplanationCard topic={topic} explanation={r.concept_explanation} />
        )}

        {/* Score */}
        <div className="rounded-2xl border border-white/10 p-6" style={{ backgroundColor: "#211C18" }}>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center shrink-0">
              <div
                className="text-5xl font-black leading-none"
                style={{ color: r.is_dont_know ? "#3B82F6" : scoreColor(r.overall_score) }}
              >
                {r.overall_score}<span className="text-2xl font-bold text-gray-500">/10</span>
              </div>
              <p
                className="text-sm font-semibold mt-1"
                style={{ color: r.is_dont_know ? "#3B82F6" : scoreColor(r.overall_score) }}
              >
                {r.is_dont_know ? "Knowledge gap, not a wrong answer" : scoreLabel(r.overall_score)}
              </p>
            </div>
            <div className="w-px h-14 bg-white/10 shrink-0 hidden sm:block" />
            <div className="flex-1 grid grid-cols-3 gap-3">
              <SubScore label="Depth" score={r.depth_score} />
              <SubScore label="Accuracy" score={r.accuracy_score} />
              <SubScore label="Production Awareness" score={r.production_awareness_score} />
            </div>
            <BookmarkButton
              sessionId={r.sessionId}
              bookmarked={r.bookmarked}
              onToggle={(next) =>
                setHistory((prev) =>
                  prev.map((h, i) => (i === viewIndex ? { ...h, result: { ...h.result, bookmarked: next } } : h))
                )
              }
            />
          </div>
        </div>
        <ResultBox color="#9CAE86" bg="rgba(156,174,134,0.06)" border="rgba(156,174,134,0.2)" icon="✓" label="WHAT LANDED WELL" body={r.what_was_strong} />
        <ResultBox color="#C57B6B" bg="rgba(197,123,107,0.06)" border="rgba(197,123,107,0.22)" icon="⚠" label="WHERE YOU CAN GROW" body={r.what_was_weak} />
        <SeniorAnswerBox
          color="#F5A623" bg="rgba(245,166,35,0.06)" border="rgba(245,166,35,0.25)"
          directAnswer={r.direct_answer} concreteExample={r.concrete_example} seniorInsight={r.senior_insight}
        />
        <CompareAnswer userAnswer={entry.answer} concreteExample={r.concrete_example} seniorInsight={r.senior_insight} />
        <GoDeeperButton ctx={{ topic, difficulty, question: entry.question, answer: entry.answer, seniorInsight: r.senior_insight }} />

        <button
          onClick={() => setViewIndex(null)}
          className="w-full py-3.5 rounded-xl font-bold text-sm border border-white/20 text-white hover:border-white/40 transition-colors"
        >
          ← Back to Question {history.length + 1}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 w-full max-w-[860px] space-y-6">

      {/* Header */}
      {headerBlock}

      {/* Question nav */}
      <QuestionNav total={questions.length} completedCount={history.length} viewIndex={viewIndex} onView={setViewIndex} />

      {/* Question card */}
      <div
        className="rounded-2xl border border-white/10 p-6 space-y-2"
        style={{ backgroundColor: "#211C18", borderLeft: "3px solid #F5A623" }}
      >
        <p className="text-xs font-bold tracking-widest" style={{ color: "#F5A623" }}>
          QUESTION {qIndex + 1} OF {questions.length}
        </p>
        <p className="text-base font-medium text-white leading-relaxed">{question}</p>
      </div>

      {/* Answer area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Your Answer
          </label>
          {micState === "recording" && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              Recording…
            </span>
          )}
          {micState === "transcribing" && (
            <span className="text-xs font-semibold" style={{ color: "#F5A623" }}>
              Transcribing…
            </span>
          )}
        </div>

        <textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setIsLiveText(false);
          }}
          onPaste={blockPaste}
          onDrop={blockPaste}
          disabled={phase !== "idle"}
          rows={8}
          placeholder="Type your answer here — or use the mic below to speak it. Aim for the depth a senior engineer would give: trade-offs, failure modes, production consequences."
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 border focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent resize-none disabled:opacity-50 transition-all duration-200 ease-out"
          style={{
            backgroundColor: "#2C2420",
            borderColor: micState === "recording" ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)",
            fontStyle: isLiveText ? "italic" : "normal",
            opacity: isLiveText ? 0.7 : 1,
            minHeight: "11.5rem",
            maxHeight: "min(50vh, 360px)",
            overflowY: "auto",
          }}
        />

        {pasteBlocked && (
          <p
            className="text-sm px-4 py-3 rounded-lg border"
            style={{ color: "#F5A623", backgroundColor: "rgba(245,166,35,0.1)", borderColor: "rgba(245,166,35,0.25)" }}
          >
            Paste is disabled here — type your answer to practice for the real thing.
          </p>
        )}

        {/* Mic button row */}
        {phase === "idle" && <MicButton micState={micState} onToggle={handleMicToggle} />}

        {(error || voiceError) && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
            {error || voiceError}
          </p>
        )}

        {(phase === "idle" || phase === "submitting") && (
          <>
            <button
              onClick={submit}
              disabled={phase === "submitting" || !answer.trim() || micState !== "idle"}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              style={{
                backgroundColor:
                  phase === "submitting"
                    ? "#2C2420"
                    : answer.trim()
                    ? "#F5A623"
                    : "transparent",
                color:
                  phase === "submitting"
                    ? "#9CA3AF"
                    : answer.trim()
                    ? "#1C1917"
                    : "rgba(245,166,35,0.55)",
                border:
                  phase === "submitting"
                    ? "1px solid rgba(255,255,255,0.1)"
                    : answer.trim()
                    ? "none"
                    : "1px solid rgba(245,166,35,0.45)",
              }}
            >
              {phase === "submitting" ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Evaluating your answer…
                </>
              ) : (
                "Submit Answer"
              )}
            </button>
            {phase === "idle" && !answer.trim() && (
              <p className="text-xs text-center" style={{ color: "#6E665C" }}>
                Type or speak your answer above to submit
              </p>
            )}
          </>
        )}
      </div>

      {/* Results */}
      {phase === "done" && result && (
        <div className="space-y-4">

          {/* Leads the results for an honest "I don't know" — a teaching
              moment, not just another score. */}
          {result.is_dont_know && (
            <ConceptExplanationCard topic={topic} explanation={result.concept_explanation} />
          )}

          {/* Score banner */}
          <div
            className="rounded-2xl border border-white/10 p-6"
            style={{ backgroundColor: "#211C18" }}
          >
            <div className="flex items-center gap-6 flex-wrap">
              <div className="text-center shrink-0">
                <div
                  className="text-5xl font-black leading-none"
                  style={{ color: result.is_dont_know ? "#3B82F6" : scoreColor(result.overall_score) }}
                >
                  {result.overall_score}
                  <span className="text-2xl font-bold text-gray-500">/10</span>
                </div>
                <p
                  className="text-sm font-semibold mt-1"
                  style={{ color: result.is_dont_know ? "#3B82F6" : scoreColor(result.overall_score) }}
                >
                  {result.is_dont_know ? "Knowledge gap, not a wrong answer" : scoreLabel(result.overall_score)}
                </p>
              </div>
              <div className="w-px h-14 bg-white/10 shrink-0 hidden sm:block" />
              <div className="flex-1 grid grid-cols-3 gap-3">
                <SubScore label="Depth" score={result.depth_score} />
                <SubScore label="Accuracy" score={result.accuracy_score} />
                <SubScore label="Production Awareness" score={result.production_awareness_score} />
              </div>
              <BookmarkButton
                sessionId={result.sessionId}
                bookmarked={result.bookmarked}
                onToggle={(next) => setResult((r) => (r ? { ...r, bookmarked: next } : r))}
              />
            </div>
          </div>

          <ResultBox
            color="#9CAE86" bg="rgba(156,174,134,0.06)" border="rgba(156,174,134,0.2)"
            icon="✓" label="WHAT LANDED WELL" body={result.what_was_strong}
          />
          <ResultBox
            color="#C57B6B" bg="rgba(197,123,107,0.06)" border="rgba(197,123,107,0.22)"
            icon="⚠" label="WHERE YOU CAN GROW" body={result.what_was_weak}
          />
          <SeniorAnswerBox
            color="#F5A623" bg="rgba(245,166,35,0.06)" border="rgba(245,166,35,0.25)"
            directAnswer={result.direct_answer} concreteExample={result.concrete_example} seniorInsight={result.senior_insight}
          />
          <CompareAnswer userAnswer={answer} concreteExample={result.concrete_example} seniorInsight={result.senior_insight} />
          <GoDeeperButton ctx={{ topic, difficulty, question, answer, seniorInsight: result.senior_insight }} />

          <button
            onClick={next}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#F5A623", color: "#1C1917" }}
          >
            {isLast ? "See Session Results →" : "Next Question →"}
          </button>
        </div>
      )}
    </div>
  );
}
