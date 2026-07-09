"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

const TRY_QUESTION = "What happens when you run kubectl apply -f deployment.yaml?";

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

export default function TryEvaluator() {
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseTextRef = useRef("");
  const finalTranscriptRef = useRef("");

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
      const res = await fetch("/api/try/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `HTTP ${res.status}`);
        setPhase("idle");
        return;
      }
      setResult(data as EvalResult);
      setPhase("done");
    } catch {
      setError("Evaluation failed. Please check your connection and try again.");
      setPhase("idle");
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-8 w-full max-w-[860px] mx-auto space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest" style={{ color: "#F5A623", letterSpacing: "0.22em", textTransform: "uppercase" }}>
          Try it — no signup required
        </p>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 500, color: "#FDF6E3", letterSpacing: "-0.01em", marginTop: 10 }}>
          Answer this question the way you would in a real interview
        </h1>
      </div>

      {/* Question card — same styling as the logged-in practice flow */}
      <div
        className="rounded-2xl border border-white/10 p-6 space-y-2"
        style={{ backgroundColor: "#211C18", borderLeft: "3px solid #F5A623" }}
      >
        <p className="text-xs font-bold tracking-widest" style={{ color: "#F5A623" }}>
          KUBERNETES · SAMPLE QUESTION
        </p>
        <p className="text-base font-medium text-white leading-relaxed">{TRY_QUESTION}</p>
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
                boxShadow: isListening ? "0 0 0 0 rgba(239,68,68,0.4)" : "none",
              }}
            >
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
          <div className="rounded-2xl border border-white/10 p-6" style={{ backgroundColor: "#211C18" }}>
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

          {/* Single CTA — the result itself is never gated, only what comes next */}
          <div
            className="rounded-2xl border p-6 text-center space-y-3"
            style={{ backgroundColor: "rgba(245,166,35,0.08)", borderColor: "rgba(245,166,35,0.3)" }}
          >
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 500, color: "#FDF6E3" }}>
              That&apos;s 1 of 8 Kubernetes questions like this.
            </p>
            <Link
              href="/register"
              className="inline-block font-semibold"
              style={{ background: "#F5A623", color: "#1C1917", fontSize: 15, padding: "13px 28px", borderRadius: 10, textDecoration: "none" }}
            >
              Sign up to unlock 7 more questions like this
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
