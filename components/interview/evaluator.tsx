"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

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
  ideal_answer: string;
};

// Web Speech API types (not in default TS lib)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
declare const webkitSpeechRecognition: new () => SpeechRecognitionInstance;

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

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
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
      <p className="text-sm text-gray-300 leading-6">{body}</p>
    </div>
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
  const [isListening, setIsListening] = useState(false);
  const [sessionScores, setSessionScores] = useState<SessionScore[]>([]);
  const [sessionDone, setSessionDone] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseTextRef = useRef("");
  const finalTranscriptRef = useRef("");

  const questions = topic ? (QUESTION_BANK[topic] ?? []) : [];
  const question = questions[qIndex] ?? "";
  const isLast = qIndex === questions.length - 1;

  // ── Voice input ─────────────────────────────────────────────────────────────

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SR =
      typeof window !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SR) {
      setError("Voice input requires Chrome or Edge. Please use one of those browsers.");
      return;
    }

    baseTextRef.current = answer;
    finalTranscriptRef.current = "";

    const recognition: SpeechRecognitionInstance = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += t + " ";
        } else {
          interim += t;
        }
      }
      const base = baseTextRef.current;
      const voiced = finalTranscriptRef.current + interim;
      const spacer = base && voiced ? " " : "";
      setAnswer(base + spacer + voiced);
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      // commit any trailing interim as final, then stop
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [answer]);

  function toggleMic() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function submit() {
    if (!answer.trim() || phase !== "idle") return;
    if (isListening) stopListening();
    setPhase("submitting");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, topic: topic ?? "General DevOps", difficulty }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: EvalResult = await res.json();
      setResult(data);
      setSessionScores((prev) => [
        ...prev,
        {
          overall: data.overall_score,
          depth: data.depth_score,
          accuracy: data.accuracy_score,
          production: data.production_awareness_score,
        },
      ]);
      setPhase("done");
    } catch {
      setError("Evaluation failed. Please check your connection and try again.");
      setPhase("idle");
    }
  }

  // ── Next question / session end ─────────────────────────────────────────────

  function next() {
    if (isListening) stopListening();
    const r = result;
    if (r) setHistory((prev) => [...prev, { question, answer, result: r }]);
    if (isLast) {
      setSessionDone(true);
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
    if (isListening) stopListening();
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

  if (!topic) {
    return <TopicSelector onStart={(t, d) => { setTopic(t); setDifficulty(d); }} />;
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

        {/* Score */}
        <div className="rounded-2xl border border-white/10 p-6" style={{ backgroundColor: "#211C18" }}>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center shrink-0">
              <div className="text-5xl font-black leading-none" style={{ color: scoreColor(r.overall_score) }}>
                {r.overall_score}<span className="text-2xl font-bold text-gray-500">/10</span>
              </div>
              <p className="text-sm font-semibold mt-1" style={{ color: scoreColor(r.overall_score) }}>{scoreLabel(r.overall_score)}</p>
            </div>
            <div className="w-px h-14 bg-white/10 shrink-0 hidden sm:block" />
            <div className="flex-1 grid grid-cols-3 gap-3">
              <SubScore label="Depth" score={r.depth_score} />
              <SubScore label="Accuracy" score={r.accuracy_score} />
              <SubScore label="Production Awareness" score={r.production_awareness_score} />
            </div>
          </div>
        </div>
        <ResultBox color="#9CAE86" bg="rgba(156,174,134,0.06)" border="rgba(156,174,134,0.2)" icon="✓" label="WHAT LANDED WELL" body={r.what_was_strong} />
        <ResultBox color="#C57B6B" bg="rgba(197,123,107,0.06)" border="rgba(197,123,107,0.22)" icon="⚠" label="WHERE YOU CAN GROW" body={r.what_was_weak} />
        <ResultBox color="#F5A623" bg="rgba(245,166,35,0.06)" border="rgba(245,166,35,0.25)" icon="⚡" label="HOW A SENIOR ENGINEER WOULD ANSWER" body={r.ideal_answer} />

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
          {isListening && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              Listening…
            </span>
          )}
        </div>

        {/* Textarea with relative wrapper for potential future inline button */}
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={phase !== "idle"}
          rows={8}
          placeholder="Type your answer here — or use the mic below to speak it. Aim for the depth a senior engineer would give: trade-offs, failure modes, production consequences."
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 border focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent resize-none disabled:opacity-50 transition-all"
          style={{
            backgroundColor: "#2C2420",
            borderColor: isListening ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)",
          }}
        />

        {/* Mic button row */}
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <button
              onClick={toggleMic}
              aria-label={isListening ? "Stop recording" : "Start voice input"}
              className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0E1A]"
              style={{
                backgroundColor: isListening ? "#EF4444" : "rgba(245,166,35,0.12)",
                border: isListening ? "2px solid #EF4444" : "2px solid rgba(245,166,35,0.4)",
                color: isListening ? "#fff" : "#F5A623",
                // pulse ring via box-shadow when listening
                boxShadow: isListening ? "0 0 0 0 rgba(239,68,68,0.4)" : "none",
              }}
            >
              {/* Outer pulse ring when recording */}
              {isListening && (
                <span
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ backgroundColor: "rgba(239,68,68,0.35)" }}
                />
              )}
              <MicIcon className="w-5 h-5 relative z-10" />
            </button>
            <p className="text-xs text-gray-500">
              {isListening ? "Click to stop recording" : "Click to speak your answer"}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {(phase === "idle" || phase === "submitting") && (
          <>
            <button
              onClick={submit}
              disabled={phase === "submitting" || !answer.trim()}
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

          {/* Score banner */}
          <div
            className="rounded-2xl border border-white/10 p-6"
            style={{ backgroundColor: "#211C18" }}
          >
            <div className="flex items-center gap-6 flex-wrap">
              <div className="text-center shrink-0">
                <div className="text-5xl font-black leading-none" style={{ color: scoreColor(result.overall_score) }}>
                  {result.overall_score}
                  <span className="text-2xl font-bold text-gray-500">/10</span>
                </div>
                <p className="text-sm font-semibold mt-1" style={{ color: scoreColor(result.overall_score) }}>
                  {scoreLabel(result.overall_score)}
                </p>
              </div>
              <div className="w-px h-14 bg-white/10 shrink-0 hidden sm:block" />
              <div className="flex-1 grid grid-cols-3 gap-3">
                <SubScore label="Depth" score={result.depth_score} />
                <SubScore label="Accuracy" score={result.accuracy_score} />
                <SubScore label="Production Awareness" score={result.production_awareness_score} />
              </div>
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
          <ResultBox
            color="#F5A623" bg="rgba(245,166,35,0.06)" border="rgba(245,166,35,0.25)"
            icon="⚡" label="HOW A SENIOR ENGINEER WOULD ANSWER" body={result.ideal_answer}
          />

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
