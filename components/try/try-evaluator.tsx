"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import SeniorAnswerBox, { RichText } from "@/components/interview/senior-answer-box";
import CompareAnswer from "@/components/interview/compare-answer";
import MicButton from "@/components/interview/mic-button";
import { useVoiceRecorder } from "@/components/interview/use-voice-recorder";
import { useCopyGuard } from "@/components/interview/use-copy-guard";

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
  direct_answer: string;
  concrete_example: string;
  senior_insight: string;
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
        <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>/10</span>
      </span>
      <span className="text-[11px] mt-0.5 text-center leading-tight" style={{ color: "var(--muted)" }}>{label}</span>
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

// ── Main component ────────────────────────────────────────────────────────────

export default function TryEvaluator() {
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState("");
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
  // Lets a candidate re-paste text they copied/cut from their own answer
  // (e.g. reusing a variable name) without reopening the door to pasting in
  // a whole answer from outside the app — see use-copy-guard.ts.
  const { trackCopy, isTrackedPaste } = useCopyGuard();

  useEffect(() => {
    return () => {
      if (pasteBlockedTimeoutRef.current) clearTimeout(pasteBlockedTimeoutRef.current);
    };
  }, []);

  function blockPaste(e: React.ClipboardEvent<HTMLTextAreaElement> | React.DragEvent<HTMLTextAreaElement>) {
    if (e.type === "paste") {
      const pasted = (e as React.ClipboardEvent<HTMLTextAreaElement>).clipboardData.getData("text/plain");
      if (isTrackedPaste(pasted)) return;
    }
    e.preventDefault();
    setPasteBlocked(true);
    if (pasteBlockedTimeoutRef.current) clearTimeout(pasteBlockedTimeoutRef.current);
    pasteBlockedTimeoutRef.current = setTimeout(() => setPasteBlocked(false), 3000);
  }

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
  // cap we also force-follow the latest text ourselves. useLayoutEffect
  // (not useEffect) so the resize commits in the same paint as the text
  // update — with useEffect there's a real gap, since it's deferred until
  // after the browser paints, which reads as a lag on a loaded mobile CPU
  // mid-recognition.
  useLayoutEffect(() => {
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
  } = useVoiceRecorder("/api/try/transcribe", handleLiveText, handleFinalText);

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
        <p className="text-xs font-bold tracking-widest" style={{ color: "var(--accent-text)", letterSpacing: "0.22em", textTransform: "uppercase" }}>
          Try it — no signup required
        </p>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 500, color: "var(--foreground)", letterSpacing: "-0.01em", marginTop: 10 }}>
          Answer this question the way you would in a real interview
        </h1>
      </div>

      {/* Question card — same styling as the logged-in practice flow */}
      <div
        className="rounded-2xl border p-6 space-y-2"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderLeft: "3px solid #F5A623" }}
      >
        <p className="text-xs font-bold tracking-widest" style={{ color: "var(--accent-text)" }}>
          KUBERNETES · SAMPLE QUESTION
        </p>
        <p className="text-base font-medium leading-relaxed" style={{ color: "var(--foreground)" }}>{TRY_QUESTION}</p>
      </div>

      {/* Answer area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Your Answer
          </label>
          {micState === "recording" && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              Recording…
            </span>
          )}
          {micState === "transcribing" && (
            <span className="text-xs font-semibold" style={{ color: "var(--accent-text)" }}>
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
          onCopy={trackCopy}
          onCut={trackCopy}
          onPaste={blockPaste}
          onDrop={blockPaste}
          disabled={phase !== "idle"}
          rows={8}
          placeholder="Type your answer here — or use the mic below to speak it. Aim for the depth a senior engineer would give: trade-offs, failure modes, production consequences."
          className="w-full rounded-xl px-4 py-3 text-sm placeholder:text-[var(--muted)] border focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent resize-none disabled:opacity-50 transition-[background-color,border-color,opacity] duration-200 ease-out"
          style={{
            backgroundColor: "var(--surface-2)",
            color: "var(--foreground)",
            borderColor: micState === "recording" ? "rgba(239,68,68,0.5)" : "var(--border)",
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
            style={{ color: "var(--accent-text)", backgroundColor: "rgba(245,166,35,0.1)", borderColor: "rgba(245,166,35,0.25)" }}
          >
            Paste is disabled here — type your answer to practice for the real thing.
          </p>
        )}

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
                    ? "var(--surface-2)"
                    : answer.trim()
                    ? "#F5A623"
                    : "transparent",
                color:
                  phase === "submitting"
                    ? "var(--muted)"
                    : answer.trim()
                    ? "var(--accent-contrast)"
                    : "rgba(245,166,35,0.55)",
                border:
                  phase === "submitting"
                    ? "1px solid var(--border)"
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
              <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
                Type or speak your answer above to submit
              </p>
            )}
          </>
        )}
      </div>

      {/* Results */}
      {phase === "done" && result && (
        <div className="space-y-4">
          <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="text-center shrink-0">
                <div className="text-5xl font-black leading-none" style={{ color: scoreColor(result.overall_score) }}>
                  {result.overall_score}
                  <span className="text-2xl font-bold" style={{ color: "var(--muted)" }}>/10</span>
                </div>
                <p className="text-sm font-semibold mt-1" style={{ color: scoreColor(result.overall_score) }}>
                  {scoreLabel(result.overall_score)}
                </p>
              </div>
              <div className="w-px h-14 shrink-0 hidden sm:block" style={{ backgroundColor: "var(--border)" }} />
              <div className="flex-1 grid grid-cols-3 gap-3">
                <SubScore label="Depth" score={result.depth_score} />
                <SubScore label="Accuracy" score={result.accuracy_score} />
                <SubScore label="Production Awareness" score={result.production_awareness_score} />
              </div>
            </div>
          </div>

          <ResultBox
            color="var(--success-text)" bg="rgba(156,174,134,0.06)" border="rgba(156,174,134,0.2)"
            icon="✓" label="WHAT LANDED WELL" body={result.what_was_strong}
          />
          <ResultBox
            color="var(--danger-text)" bg="rgba(197,123,107,0.06)" border="rgba(197,123,107,0.22)"
            icon="⚠" label="WHERE YOU CAN GROW" body={result.what_was_weak}
          />
          <SeniorAnswerBox
            color="var(--accent-text)" bg="rgba(245,166,35,0.06)" border="rgba(245,166,35,0.25)"
            directAnswer={result.direct_answer} concreteExample={result.concrete_example} seniorInsight={result.senior_insight}
          />
          <CompareAnswer userAnswer={answer} concreteExample={result.concrete_example} seniorInsight={result.senior_insight} />

          {/* Hari chat is an authenticated-only feature — prompt signup rather
              than bouncing an anonymous visitor through a login wall. */}
          <Link
            href="/register"
            className="block w-full text-center py-3 rounded-xl font-semibold text-sm border transition-colors hover:bg-[var(--hover-overlay)]"
            style={{ borderColor: "rgba(245,166,35,0.35)", color: "var(--accent-text)", background: "transparent", textDecoration: "none" }}
          >
            Sign up to ask Hari to go deeper on this →
          </Link>

          {/* Single CTA — the result itself is never gated, only what comes next */}
          <div
            className="rounded-2xl border p-6 text-center space-y-3"
            style={{ backgroundColor: "rgba(245,166,35,0.08)", borderColor: "rgba(245,166,35,0.3)" }}
          >
            <p style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 500, color: "var(--foreground)" }}>
              That&apos;s 1 of 8 Kubernetes questions like this.
            </p>
            <Link
              href="/register"
              className="inline-block font-semibold"
              style={{ background: "#F5A623", color: "var(--accent-contrast)", fontSize: 15, padding: "13px 28px", borderRadius: 10, textDecoration: "none" }}
            >
              Sign up to unlock 7 more questions like this
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
