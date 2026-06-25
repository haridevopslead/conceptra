"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "asking" | "answering" | "evaluating" | "reviewed" | "complete";

type Entry = {
  question: string;
  answer: string;
  feedback: string;
  score: number | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractScore(text: string): number | null {
  const m = text.match(/Score:\s*(\d+)\/10/i);
  return m ? Math.min(10, Math.max(0, parseInt(m[1], 10))) : null;
}

function scoreColor(score: number): string {
  if (score >= 8) return "#F5A623";
  if (score >= 6) return "#10B981";
  if (score >= 4) return "#F59E0B";
  return "#EF4444";
}

function scoreLabel(avg: number): string {
  if (avg >= 8) return "Excellent";
  if (avg >= 6) return "Good";
  if (avg >= 4) return "Needs Work";
  return "Keep Practicing";
}

async function streamFromAPI(
  body: object,
  onChunk: (t: string) => void,
): Promise<string> {
  const res = await fetch("/api/interview/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error("Stream failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onChunk(chunk);
  }
  return full;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "#1F2937" }}>
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: "#F5A623" }}
      />
    </div>
  );
}

function StreamingText({ text, streaming }: { text: string; streaming: boolean }) {
  return (
    <p className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap">
      {text}
      {streaming && (
        <span
          className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
          style={{ backgroundColor: "#F5A623" }}
        />
      )}
    </p>
  );
}

function FeedbackCard({ feedback }: { feedback: string }) {
  const score = extractScore(feedback);

  // Split into sections for nicer rendering
  const lines = feedback.trim().split("\n").filter(Boolean);
  const scoreLine = lines.find((l) => /^Score:/i.test(l));
  const rest = lines.filter((l) => !/^Score:/i.test(l)).join("\n");

  return (
    <div
      className="rounded-xl border p-5 space-y-3"
      style={{ backgroundColor: "#0F1923", borderColor: "rgba(245,166,35,0.3)" }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Feedback
        </span>
        {score !== null && (
          <span
            className="text-sm font-bold px-2.5 py-0.5 rounded-full ml-auto"
            style={{ backgroundColor: `${scoreColor(score)}20`, color: scoreColor(score) }}
          >
            {scoreLine ?? `Score: ${score}/10`}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{rest}</p>
    </div>
  );
}

// ── Results screen ────────────────────────────────────────────────────────────

function Results({
  entries,
  topic,
  level,
}: {
  entries: Entry[];
  topic: string;
  level: string;
}) {
  const scored = entries.filter((e) => e.score !== null);
  const avg =
    scored.length > 0
      ? Math.round(scored.reduce((s, e) => s + e.score!, 0) / scored.length)
      : 0;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Summary */}
      <div
        className="rounded-2xl border border-white/10 p-8 text-center space-y-2"
        style={{ backgroundColor: "#111827" }}
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Interview Complete
        </p>
        <div
          className="text-6xl font-black mt-2"
          style={{ color: scored.length > 0 ? scoreColor(avg) : "#6B7280" }}
        >
          {scored.length > 0 ? `${avg}/10` : "—"}
        </div>
        <p className="text-lg font-semibold text-white">
          {scored.length > 0 ? scoreLabel(avg) : "No scores recorded"}
        </p>
        <p className="text-sm text-gray-400">
          {topic} &middot; {level} &middot; {entries.length} question
          {entries.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-4">
        {entries.map((e, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 overflow-hidden"
            style={{ backgroundColor: "#111827" }}
          >
            {/* Question header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10">
              <div>
                <p className="text-xs text-gray-500 mb-1">Question {i + 1}</p>
                <p className="text-sm text-white font-medium">{e.question}</p>
              </div>
              {e.score !== null && (
                <span
                  className="shrink-0 text-sm font-bold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${scoreColor(e.score)}20`,
                    color: scoreColor(e.score),
                  }}
                >
                  {e.score}/10
                </span>
              )}
            </div>

            {/* Answer */}
            <div className="px-5 py-3 border-b border-white/10">
              <p className="text-xs text-gray-500 mb-1">Your answer</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{e.answer || "—"}</p>
            </div>

            {/* Feedback */}
            <div className="px-5 py-3">
              <p className="text-xs text-gray-500 mb-1">Feedback</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {e.feedback
                  .split("\n")
                  .filter((l) => !/^Score:/i.test(l))
                  .join("\n")
                  .trim()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/interview"
          className="flex-1 py-3 rounded-xl text-sm font-bold text-center border border-white/20 text-white hover:border-white/40 transition-colors"
        >
          Try another topic
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 py-3 rounded-xl text-sm font-bold text-center transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#F5A623", color: "#0A0E1A" }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

// ── Main session component ────────────────────────────────────────────────────

export default function InterviewSession() {
  const params = useSearchParams();
  const router = useRouter();

  const topic = params.get("topic") ?? "General DevOps";
  const level = params.get("level") ?? "Mid-level (2–5 yrs)";
  const totalCount = Math.min(10, Math.max(1, parseInt(params.get("count") ?? "5", 10)));

  const [phase, setPhase] = useState<Phase>("asking");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streamedText, setStreamedText] = useState("");
  const [answer, setAnswer] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const previousQs = useRef<string[]>([]);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  // ── Ask question ────────────────────────────────────────────────────────────

  const askQuestion = useCallback(
    async (index: number) => {
      setPhase("asking");
      setStreamedText("");
      setError("");

      const prevList =
        previousQs.current.length > 0
          ? ` Previous questions asked: "${previousQs.current.join('"; "')}". Ask something different.`
          : "";

      try {
        const question = await streamFromAPI(
          {
            topic,
            level,
            messages: [
              {
                role: "user",
                content: `Ask me question ${index + 1} of ${totalCount} about ${topic} at the ${level} level.${prevList}`,
              },
            ],
          },
          (chunk) => setStreamedText((p) => p + chunk),
        );

        previousQs.current.push(question.slice(0, 80));
        setEntries((prev) => {
          const next = [...prev];
          next[index] = { question, answer: "", feedback: "", score: null };
          return next;
        });
        setPhase("answering");
        setTimeout(() => answerRef.current?.focus(), 50);
      } catch {
        setError("Could not reach the AI. Check your ANTHROPIC_API_KEY and try again.");
        setPhase("answering");
      }
    },
    [topic, level, totalCount],
  );

  // Kick off first question on mount
  useEffect(() => {
    askQuestion(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Submit answer ───────────────────────────────────────────────────────────

  async function submitAnswer() {
    if (!answer.trim()) return;
    const question = entries[currentIndex]?.question ?? streamedText;

    setPhase("evaluating");
    setStreamedText("");

    let feedback = "";
    try {
      feedback = await streamFromAPI(
        {
          topic,
          level,
          messages: [
            { role: "user", content: `EVALUATE: The question was: "${question}"\n\nMy answer: ${answer}` },
          ],
        },
        (chunk) => setStreamedText((p) => p + chunk),
      );
    } catch {
      feedback = "Could not generate feedback. Please check your connection.";
    }

    const score = extractScore(feedback);
    setEntries((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], answer, feedback, score };
      return next;
    });
    setPhase("reviewed");
  }

  // ── Next question ───────────────────────────────────────────────────────────

  function next() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= totalCount) {
      setPhase("complete");
    } else {
      setAnswer("");
      setCurrentIndex(nextIndex);
      askQuestion(nextIndex);
    }
  }

  // ── Complete screen ─────────────────────────────────────────────────────────

  if (phase === "complete") {
    return <Results entries={entries} topic={topic} level={level} />;
  }

  // ── Session screen ──────────────────────────────────────────────────────────

  const currentQuestion = entries[currentIndex]?.question ?? "";
  const isStreaming = phase === "asking" || phase === "evaluating";
  const canSubmit = phase === "answering" && answer.trim().length > 0;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Question {currentIndex + 1} of {totalCount}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "#1F2937", color: "#9CA3AF" }}
            >
              {topic}
            </span>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: "#1F2937", color: "#9CA3AF" }}
          >
            {level}
          </span>
        </div>
        <ProgressBar current={currentIndex} total={totalCount} />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20">
          {error}
        </div>
      )}

      {/* Question card */}
      <div
        className="rounded-xl border border-white/10 p-6 space-y-2"
        style={{ backgroundColor: "#111827" }}
      >
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {phase === "asking" ? "Generating question…" : "Question"}
        </p>
        <StreamingText
          text={phase === "asking" ? streamedText : currentQuestion}
          streaming={phase === "asking"}
        />
      </div>

      {/* Answer area — visible once question is done */}
      {(phase === "answering" || phase === "evaluating" || phase === "reviewed") && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Your answer
          </label>
          <textarea
            ref={answerRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={phase !== "answering"}
            rows={6}
            placeholder="Type your answer here…"
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent resize-none disabled:opacity-60"
            style={{ backgroundColor: "#111827" }}
          />

          {phase === "answering" && (
            <button
              onClick={submitAnswer}
              disabled={!canSubmit}
              className="w-full py-3 rounded-xl font-bold text-sm transition-opacity disabled:opacity-40 hover:opacity-90"
              style={{ backgroundColor: "#F5A623", color: "#0A0E1A" }}
            >
              Submit Answer
            </button>
          )}
        </div>
      )}

      {/* Feedback — evaluating (streaming) or reviewed */}
      {phase === "evaluating" && (
        <div
          className="rounded-xl border p-5"
          style={{ backgroundColor: "#0F1923", borderColor: "rgba(245,166,35,0.3)" }}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Evaluating…
          </p>
          <StreamingText text={streamedText} streaming />
        </div>
      )}

      {phase === "reviewed" && entries[currentIndex] && (
        <div className="space-y-4">
          <FeedbackCard feedback={entries[currentIndex].feedback} />

          <button
            onClick={next}
            className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#F5A623", color: "#0A0E1A" }}
          >
            {currentIndex + 1 >= totalCount ? "See Results →" : "Next Question →"}
          </button>
        </div>
      )}
    </div>
  );
}
