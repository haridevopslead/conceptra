"use client";

import { useState } from "react";

// ── Term extraction & presence check ──────────────────────────────────────────
// Lightweight heuristic, not a real diff: pull the backtick-wrapped terms the
// evaluation prompt already produces (commands/flags/config keys/exit codes)
// and do a case-insensitive substring check against the user's raw answer.

function extractTerms(text: string): string[] {
  const regex = /`([^`\n]+)`/g;
  const terms: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (!terms.includes(m[1])) terms.push(m[1]);
  }
  return terms;
}

function wasMentioned(term: string, userAnswer: string): boolean {
  return userAnswer.toLowerCase().includes(term.toLowerCase());
}

// ── Senior-side text with terms marked green (mentioned) / amber (missed) ─────

function HighlightedText({ text, userAnswer }: { text: string; userAnswer: string }) {
  const parts = text.split(/(`[^`\n]+`)/g);
  return (
    <p className="text-sm text-gray-300 leading-6">
      {parts.map((part, i) => {
        const match = part.match(/^`([^`\n]+)`$/);
        if (!match) return <span key={i}>{part}</span>;
        const term = match[1];
        const mentioned = wasMentioned(term, userAnswer);
        return (
          <code
            key={i}
            title={mentioned ? "You mentioned this" : "You didn't mention this"}
            className="font-mono text-[0.85em] px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: mentioned ? "rgba(156,174,134,0.16)" : "rgba(197,123,107,0.18)",
              color: mentioned ? "#B7D2A0" : "#E0A38F",
            }}
          >
            {term}
          </code>
        );
      })}
    </p>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export default function CompareAnswer({
  userAnswer, concreteExample, seniorInsight,
}: {
  userAnswer: string; concreteExample: string; seniorInsight: string;
}) {
  const [open, setOpen] = useState(false);
  const terms = [...extractTerms(concreteExample), ...extractTerms(seniorInsight)];
  const mentionedCount = terms.filter((t) => wasMentioned(t, userAnswer)).length;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#211C18", borderColor: "rgba(253,246,227,0.08)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 text-left px-5 py-4"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <span className="text-sm font-semibold" style={{ color: "#FDF6E3" }}>
          Compare with your answer
          {terms.length > 0 && (
            <span className="ml-2 text-xs font-normal" style={{ color: "#8A8073" }}>
              ({mentionedCount}/{terms.length} key terms mentioned)
            </span>
          )}
        </span>
        <span
          className="shrink-0 transition-transform"
          style={{ color: "#F5A623", fontSize: 20, fontWeight: 500, lineHeight: 1, transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Your Answer</p>
            <div
              className="rounded-lg p-4 text-sm text-gray-300 leading-6 whitespace-pre-wrap"
              style={{ backgroundColor: "#17130F", border: "1px solid rgba(253,246,227,0.06)" }}
            >
              {userAnswer}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Senior Answer</p>
            <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "#17130F", border: "1px solid rgba(253,246,227,0.06)" }}>
              <HighlightedText text={concreteExample} userAnswer={userAnswer} />
              <HighlightedText text={seniorInsight} userAnswer={userAnswer} />
            </div>
            {terms.length > 0 && (
              <div className="flex items-center gap-4 text-[11px]" style={{ color: "#8A8073" }}>
                <span className="flex items-center gap-1.5">
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "#9CAE86" }} />
                  You mentioned this
                </span>
                <span className="flex items-center gap-1.5">
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "#C57B6B" }} />
                  You missed this
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
