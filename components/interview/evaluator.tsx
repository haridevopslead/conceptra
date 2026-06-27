"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

// ── Question bank ─────────────────────────────────────────────────────────────

const QUESTIONS = [
  "What is the difference between a Docker image and a Docker container? How would you explain this to a junior engineer joining your team?",
  "Your Kubernetes pod is stuck in CrashLoopBackOff. Walk me through exactly how you would debug it in production.",
  "Explain the difference between horizontal and vertical scaling. When would you choose one over the other in a real production system?",
  "How would you design a zero-downtime deployment pipeline for a stateful service that requires a database schema migration?",
  "What is a service mesh and when would you actually introduce one — versus when would it be overkill?",
  "A microservice is responding slowly in production. Walk me through your entire debugging process from alert to resolution.",
  "What is the difference between a Deployment and a StatefulSet in Kubernetes, and when would you use each?",
];

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

// ── Main component ────────────────────────────────────────────────────────────

export default function Evaluator() {
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);

  // refs so callbacks always see current values without stale closure
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseTextRef = useRef("");      // text in textarea when mic was pressed
  const finalTranscriptRef = useRef(""); // confirmed words from this session

  const question = QUESTIONS[qIndex];
  const isLast = qIndex === QUESTIONS.length - 1;

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
        body: JSON.stringify({ question, answer }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: EvalResult = await res.json();
      setResult(data);
      setPhase("done");
    } catch {
      setError("Evaluation failed. Please check your connection and try again.");
      setPhase("idle");
    }
  }

  // ── Next question ───────────────────────────────────────────────────────────

  function next() {
    if (isListening) stopListening();
    setQIndex((i) => (i + 1) % QUESTIONS.length);
    setAnswer("");
    setResult(null);
    setPhase("idle");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 w-full max-w-[860px] space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Mock Interview</h1>
          <p className="text-sm text-gray-400 mt-1">
            Answer the question as you would in a real interview. Claude grades like a senior engineer.
          </p>
        </div>
        <Link
          href="/interview/session?topic=General+DevOps&level=Mid-level+%282%E2%80%935+yrs%29&count=5"
          className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg border border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition-colors"
        >
          Full session →
        </Link>
      </div>

      {/* Question card */}
      <div
        className="rounded-2xl border border-white/10 p-6 space-y-2"
        style={{ backgroundColor: "#111827", borderLeft: "3px solid #F5A623" }}
      >
        <p className="text-xs font-bold tracking-widest" style={{ color: "#F5A623" }}>
          QUESTION {qIndex + 1} OF {QUESTIONS.length}
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
            backgroundColor: "#111827",
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

        {phase === "idle" && (
          <button
            onClick={submit}
            disabled={!answer.trim()}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-opacity disabled:opacity-40 hover:opacity-90"
            style={{ backgroundColor: "#F5A623", color: "#0A0E1A" }}
          >
            Submit Answer
          </button>
        )}

        {phase === "submitting" && (
          <div
            className="w-full py-3.5 rounded-xl text-sm font-bold text-center border border-white/10 text-gray-400"
            style={{ backgroundColor: "#111827" }}
          >
            <span className="animate-pulse">Evaluating your answer…</span>
          </div>
        )}
      </div>

      {/* Results */}
      {phase === "done" && result && (
        <div className="space-y-4">

          {/* Score banner */}
          <div
            className="rounded-2xl border border-white/10 p-6"
            style={{ backgroundColor: "#111827" }}
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
            color="#EF4444" bg="rgba(239,68,68,0.07)" border="rgba(239,68,68,0.2)"
            icon="⚠" label="WHAT WAS WEAK" body={result.what_was_weak}
          />
          <ResultBox
            color="#10B981" bg="rgba(16,185,129,0.07)" border="rgba(16,185,129,0.2)"
            icon="✓" label="WHAT WAS STRONG" body={result.what_was_strong}
          />
          <ResultBox
            color="#F5A623" bg="rgba(245,166,35,0.07)" border="rgba(245,166,35,0.25)"
            icon="⚡" label="THE 9/10 ANSWER" body={result.ideal_answer}
          />

          <button
            onClick={next}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#F5A623", color: "#0A0E1A" }}
          >
            {isLast ? "Restart from Q1 →" : "Next Question →"}
          </button>
        </div>
      )}
    </div>
  );
}
