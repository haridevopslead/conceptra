"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TOPICS = [
  { id: "Kubernetes & Containers", label: "Kubernetes & Containers", color: "#3B82F6" },
  { id: "CI/CD Pipelines", label: "CI/CD Pipelines", color: "#8B5CF6" },
  { id: "Cloud Architecture", label: "Cloud Architecture", color: "#06B6D4" },
  { id: "Infrastructure as Code", label: "Infrastructure as Code", color: "#F97316" },
  { id: "Monitoring & Observability", label: "Monitoring & Observability", color: "#10B981" },
  { id: "Site Reliability Engineering", label: "Site Reliability Engineering", color: "#EF4444" },
  { id: "General DevOps", label: "General DevOps", color: "#F5A623" },
];

const LEVELS = [
  { id: "Junior (0–2 yrs)", label: "Junior", sub: "0–2 years" },
  { id: "Mid-level (2–5 yrs)", label: "Mid-level", sub: "2–5 years" },
  { id: "Senior / Lead (5+ yrs)", label: "Senior / Lead", sub: "5+ years" },
];

const COUNTS = [3, 5, 10];

type Props = { plan: string };

export default function InterviewSetup({ plan }: Props) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [count, setCount] = useState(5);

  const canStart = topic && level;

  function start() {
    if (!canStart) return;
    const params = new URLSearchParams({ topic, level, count: String(count) });
    router.push(`/interview/session?${params.toString()}`);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Mock Interview</h1>
        <p className="text-sm text-gray-400 mt-1">
          An AI interviewer will ask you real DevOps questions and grade your answers live.
        </p>
      </div>

      {/* Step 1 — Topic */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          1 &nbsp;Choose a topic
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOPICS.map((t) => {
            const active = topic === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTopic(t.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors"
                style={{
                  backgroundColor: active ? `${t.color}15` : "#111827",
                  borderColor: active ? t.color : "rgba(255,255,255,0.1)",
                  color: active ? t.color : "#9CA3AF",
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: active ? t.color : "#374151" }}
                />
                <span className="text-sm font-medium">{t.label}</span>
                {active && (
                  <svg
                    className="w-4 h-4 ml-auto shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2 — Level */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          2 &nbsp;Your experience level
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {LEVELS.map((l) => {
            const active = level === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className="flex flex-col items-center py-4 px-3 rounded-xl border transition-colors text-center"
                style={{
                  backgroundColor: active ? "rgba(245,166,35,0.1)" : "#111827",
                  borderColor: active ? "#F5A623" : "rgba(255,255,255,0.1)",
                }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: active ? "#F5A623" : "#D1D5DB" }}
                >
                  {l.label}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">{l.sub}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 3 — Question count */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          3 &nbsp;Number of questions
        </h2>
        <div className="flex gap-3">
          {COUNTS.map((n) => {
            const active = count === n;
            const locked = n === 10 && plan === "FREE";
            return (
              <button
                key={n}
                onClick={() => !locked && setCount(n)}
                disabled={locked}
                className="flex-1 py-3 rounded-xl border text-sm font-semibold transition-colors relative"
                style={{
                  backgroundColor: active ? "rgba(245,166,35,0.1)" : "#111827",
                  borderColor: active ? "#F5A623" : "rgba(255,255,255,0.1)",
                  color: locked ? "#4B5563" : active ? "#F5A623" : "#9CA3AF",
                  cursor: locked ? "not-allowed" : "pointer",
                }}
              >
                {n} questions
                {locked && (
                  <span
                    className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "#F5A623", color: "#0A0E1A" }}
                  >
                    Pro
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <button
        onClick={start}
        disabled={!canStart}
        className="w-full py-4 rounded-xl font-bold text-base transition-opacity disabled:opacity-40"
        style={{ backgroundColor: "#F5A623", color: "#0A0E1A" }}
      >
        {canStart ? "Start Interview →" : "Select a topic and level to begin"}
      </button>
    </div>
  );
}
