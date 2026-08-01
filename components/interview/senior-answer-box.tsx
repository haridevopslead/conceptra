"use client";

import { useState, type ReactNode } from "react";
import { Target, Terminal, Lightbulb, Copy, Check, type LucideIcon } from "lucide-react";

// ── Rich text parsing — inline `code` spans and fenced ```code blocks``` ──────

type Segment =
  | { type: "text"; content: string }
  | { type: "code"; content: string }
  | { type: "block"; content: string };

function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  const inlineRegex = /`([^`\n]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    segments.push({ type: "code", content: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ type: "text", content: text.slice(lastIndex) });
  return segments;
}

function parseSegments(raw: string): Segment[] {
  const segments: Segment[] = [];
  const blockRegex = /```(?:\w+\n)?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) segments.push(...parseInline(raw.slice(lastIndex, match.index)));
    segments.push({ type: "block", content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < raw.length) segments.push(...parseInline(raw.slice(lastIndex)));
  return segments;
}

function extractCodeBlocks(text: string): string[] {
  const regex = /```(?:\w+\n)?([\s\S]*?)```/g;
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) blocks.push(m[1].trim());
  return blocks;
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code
      className="font-mono text-[0.85em] px-1.5 py-0.5 rounded"
      style={{ backgroundColor: "var(--border)", color: "var(--accent-text)" }}
    >
      {children}
    </code>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre
      className="rounded-lg overflow-x-auto text-[12.5px] leading-relaxed"
      style={{ backgroundColor: "var(--code-bg)", padding: "12px 14px", border: "1px solid var(--border)" }}
    >
      <code className="font-mono" style={{ color: "var(--foreground)" }}>{code}</code>
    </pre>
  );
}

// Exported so any other result field (e.g. what_was_strong/what_was_weak)
// can render backticked text safely instead of showing literal backtick characters.
export function RichText({ text }: { text: string }) {
  const segments = parseSegments(text);
  const nodes: ReactNode[] = [];
  let inlineBuffer: ReactNode[] = [];

  const flushInline = (key: string) => {
    if (inlineBuffer.length > 0) {
      nodes.push(
        <p key={key} className="text-sm leading-6" style={{ color: "var(--foreground)" }}>
          {inlineBuffer}
        </p>
      );
      inlineBuffer = [];
    }
  };

  segments.forEach((seg, i) => {
    if (seg.type === "text") {
      inlineBuffer.push(<span key={i}>{seg.content}</span>);
    } else if (seg.type === "code") {
      inlineBuffer.push(<InlineCode key={i}>{seg.content}</InlineCode>);
    } else {
      flushInline(`p-${i}`);
      nodes.push(<CodeBlock key={`b-${i}`} code={seg.content} />);
    }
  });
  flushInline("p-last");

  return <div className="space-y-2">{nodes}</div>;
}

// ── One labeled beat: Direct Answer / Real Example / Senior Insight ───────────

function Beat({
  icon: Icon, label, text, accent, delayMs,
}: {
  icon: LucideIcon; label: string; text: string; accent: string; delayMs: number;
}) {
  const [copied, setCopied] = useState(false);
  const codeBlocks = extractCodeBlocks(text);
  const hasBlock = codeBlocks.length > 0;

  function handleCopy() {
    navigator.clipboard.writeText(codeBlocks.join("\n\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => { /* clipboard access denied — fail silently, no destructive fallback needed */ });
  }

  return (
    <div
      className="space-y-1.5"
      style={{
        borderLeft: `2px solid ${accent}`,
        paddingLeft: 12,
        opacity: 0,
        animation: `beatFadeIn 420ms ease-out ${delayMs}ms both`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          <Icon size={12} style={{ color: accent }} />
          {label}
        </p>
        {hasBlock && (
          <button
            onClick={handleCopy}
            aria-label={`Copy ${label} code`}
            className="transition-colors hover:text-[var(--foreground)]"
            style={{ color: "var(--muted)" }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        )}
      </div>
      <RichText text={text} />
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export default function SeniorAnswerBox({
  color, bg, border, directAnswer, concreteExample, seniorInsight,
}: {
  color: string; bg: string; border: string; directAnswer: string; concreteExample: string; seniorInsight: string;
}) {
  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: bg, borderColor: border }}>
      <p className="text-xs font-bold tracking-wider" style={{ color }}>⚡ HOW A SENIOR ENGINEER WOULD ANSWER</p>
      <Beat icon={Target} label="Direct Answer" text={directAnswer} accent="#7B93B0" delayMs={0} />
      <Beat icon={Terminal} label="Real Example" text={concreteExample} accent="#7FA88A" delayMs={100} />
      <Beat icon={Lightbulb} label="Senior Insight" text={seniorInsight} accent="#D9A652" delayMs={200} />
    </div>
  );
}
