"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useVoiceRecorder } from "@/components/interview/use-voice-recorder";
import MicButton from "@/components/interview/mic-button";

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen = "setup" | "chat" | "feedback";

type Message = { role: "user" | "assistant"; content: string };

interface FeedbackData {
  score: string;
  strong: string;
  improve: string;
  seniorAnswer: string;
}

// One-time context handed off from a Quick Practice result via sessionStorage —
// no persistence, cleared immediately after being read.
interface DevHandoffContext {
  topic: string;
  difficulty: string;
  question: string;
  answer: string;
  seniorInsight: string;
}

const HANDOFF_KEY = "devHandoffContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const TOPICS = [
  "Docker", "Kubernetes", "CI/CD", "AWS",
  "Terraform", "Linux", "Git", "Observability",
] as const;

const TOPIC_CODE: Record<string, string> = {
  Docker: "DO", Kubernetes: "K8", "CI/CD": "CD", AWS: "AW",
  Terraform: "TF", Linux: "LX", Git: "GT", Observability: "OB",
};

const DIFFICULTIES = ["Beginner", "Intermediate", "Senior"] as const;
type Difficulty = typeof DIFFICULTIES[number];

type Mode = "topic" | "jd";

// Bounded to control token cost and prevent abuse; the minimum is just a
// sanity floor to catch empty/junk input, not a quality bar — a genuinely
// short JD should still make it to Hari rather than being rejected.
const JD_MAX_LENGTH = 6000;
const JD_MIN_LENGTH = 40;

// ── Helpers ───────────────────────────────────────────────────────────────────

// Best-effort label for the feedback screen / chat header when there's no
// fixed topic to show — most real postings open with a title line ("Senior
// DevOps Engineer", "Job Title: SRE II"). Falls back to a generic label
// rather than guessing wrong on an unusual format.
function extractJdTitle(jd: string): string {
  const firstLine = jd
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0) ?? "";
  const cleaned = firstLine.replace(/^(job title|title|position|role)\s*:\s*/i, "").trim();
  return cleaned.length >= 3 && cleaned.length <= 70 ? cleaned : "Job description session";
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")            // # headings
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1") // **bold**, may span lines
    .replace(/\*([\s\S]+?)\*/g, "$1");    // *italic*, may span lines
}

const VOICE_CORRECTIONS: [RegExp, string][] = [
  [/\bdoctor's\b/gi, "Docker's"],
  [/\bdoctor\b/gi, "Docker"],
  [/\bcube\s+8\s+s\b/gi, "Kubernetes"],
  [/\bcube\b/gi, "Kubernetes"],
  [/\bterra\s+form\b/gi, "Terraform"],
  [/\bget\s+hub\b/gi, "GitHub"],
  [/\bget\b/g, "Git"],
  [/\bjenkins\b/gi, "Jenkins"],
  [/\bansible\b/gi, "Ansible"],
  [/\bpromete[uo]s\b/gi, "Prometheus"],
  [/\bgrafana\b/gi, "Grafana"],
];

function correctVoice(text: string): string {
  return VOICE_CORRECTIONS.reduce((t, [re, sub]) => t.replace(re, sub), text);
}

function buildContextKickoff(ctx: DevHandoffContext): string {
  return `Hi Hari! I just practiced this question in Quick Practice: "${ctx.question}"

Here's the answer I gave: "${ctx.answer}"

I already got scored feedback, and the senior-level insight I received was: "${ctx.seniorInsight}"

I want to go deeper on this with you specifically. Don't ask me a fresh unrelated question — instead, open with one short line in this style: "Let's go deeper on ${ctx.topic} — you mentioned [a brief summary of what I said], let's talk through [the specific gap or trade-off from that senior insight]." Then follow it with one pointed follow-up question that pushes on that exact gap.`;
}

// A field is "meaningful" once markdown delimiters and whitespace are stripped —
// guards against the model wrapping a bare label like **STRONG:** (no body)
// leaving only punctuation behind after parsing.
function meaningful(value: string): string {
  return /[a-zA-Z0-9]/.test(value) ? value : "";
}

// True once the model has actually reached the final feedback turn.
// SENIOR_ANSWER is deliberately matched as a bare token (no required
// trailing colon) — the model sometimes writes "**SENIOR_ANSWER** (to
// "..."):" instead of "SENIOR_ANSWER:", and requiring the colon
// immediately after the label silently missed that variant, leaving the
// feedback rendered as a plain chat bubble instead of the scored screen.
function isFeedbackTurn(text: string): boolean {
  return /SCORE\s*:/.test(text) && /SENIOR_ANSWER\b/.test(text);
}

function parseFeedback(text: string): FeedbackData {
  // Strip markdown from the whole response first. The model sometimes bolds the
  // field labels themselves (e.g. "**STRONG:**\nbody..." instead of the requested
  // "STRONG: body"), which previously broke label matching and left the body on
  // its own line, undetected by the old single-line field regexes.
  const clean = stripMarkdown(text);
  const score = clean.match(/SCORE:\s*(.+)/)?.[1]?.trim() ?? "";
  const strong = meaningful(
    clean.match(/STRONG:\s*([\s\S]*?)(?=\s*IMPROVE:|\s*SENIOR_ANSWER\b|$)/)?.[1]?.trim() ?? ""
  );
  const improve = meaningful(
    clean.match(/IMPROVE:\s*([\s\S]*?)(?=\s*SENIOR_ANSWER\b|$)/)?.[1]?.trim() ?? ""
  );
  // SENIOR_ANSWER may be followed by extra text before the real colon (e.g.
  // "SENIOR_ANSWER (to \"...\"):") — [^:]* skips over that instead of
  // requiring the colon immediately after the label.
  const seniorAnswer = meaningful(
    clean.match(/SENIOR_ANSWER\b[^:]*:\s*([\s\S]+)/)?.[1]?.trim() ?? ""
  );
  return { score, strong, improve, seniorAnswer };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DevInterviewPage() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [checkingHandoff, setCheckingHandoff] = useState(true);
  // Only true when this chat was opened via the Quick Practice handoff —
  // a manually-started Hari session has no practice session to link back to.
  const [cameFromPractice, setCameFromPractice] = useState(false);
  // Lets the Growth page's "Practice this again" links preselect a topic
  // (e.g. /interview/dev?topic=Docker) instead of always defaulting to
  // Docker — falls back to the default for anything outside the fixed list.
  const searchParams = useSearchParams();
  const queryTopic = searchParams.get("topic");
  const [topic, setTopic] = useState<string>(
    queryTopic && (TOPICS as readonly string[]).includes(queryTopic) ? queryTopic : "Docker"
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");

  // JD-paste mode: an alternative to the fixed topic picker. Session-only —
  // the pasted JD is never persisted, and JD sessions don't feed the
  // HariSessionLog/HariWeakArea memory system (see route.ts).
  const [mode, setMode] = useState<Mode>("topic");
  const [jdText, setJdText] = useState("");
  const [jdError, setJdError] = useState("");
  // Set only once a JD session actually starts — distinct from jdText (which
  // keeps whatever's in the textarea) so mid-chat display/requests use a
  // stable snapshot even if the user could otherwise edit the source text.
  const [activeJd, setActiveJd] = useState<string | null>(null);
  const [roleLabel, setRoleLabel] = useState("");

  // FREE-plan upgrade nudge: "you've done this topic before" — only ever
  // set for FREE users (PRO gets real memory instead, see route.ts). Tracks
  // dismissals per topic so switching away and back re-shows it, but
  // dismissing it once for the current topic sticks for this visit.
  const [priorTopicNudge, setPriorTopicNudge] = useState(false);
  const dismissedNudgeTopicsRef = useRef<Set<string>>(new Set());

  // Visible messages only — the kickoff user message is hidden from the UI
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [isLiveText, setIsLiveText] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [error, setError] = useState("");

  // Full API conversation history (includes the hidden kickoff)
  const apiHistoryRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Set right before a voice-driven setInput() so the effect below knows to
  // follow the caret — plain typing already scrolls natively and shouldn't
  // be hijacked mid-edit.
  const voiceUpdateRef = useRef(false);
  // Snapshot of `input` the instant recording starts, so live captions and
  // the final Groq transcript both append after whatever was already typed,
  // the same base/live/final pattern used in Quick Practice.
  const baseInputRef = useRef("");
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages]);

  // Auto-grow the textarea to fit its content (typing or voice) instead of
  // staying a fixed 3 lines with hidden overflow — reset to auto so
  // scrollHeight reflects the true content height, then apply it; CSS
  // max-height/overflow-y on .chat-textarea caps the growth and switches to
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
  }, [input]);

  // Checks, per selected topic, whether this user has practiced it before —
  // only surfaces the nudge for FREE users (PRO doesn't need it, it gets
  // real memory instead). Runs on the setup screen only.
  useEffect(() => {
    if (checkingHandoff || screen !== "setup" || mode !== "topic") return;
    let cancelled = false;
    fetch(`/api/interview/dev/history?topic=${encodeURIComponent(topic)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setPriorTopicNudge(
          data.plan === "FREE" && data.hasPriorSession && !dismissedNudgeTopicsRef.current.has(topic)
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [topic, screen, checkingHandoff, mode]);

  function dismissPriorTopicNudge() {
    dismissedNudgeTopicsRef.current.add(topic);
    setPriorTopicNudge(false);
  }

  // ── Streaming fetch ──────────────────────────────────────────────────────────

  async function fetchStream(
    apiMessages: Message[],
    topicArg: string,
    difficultyArg: string,
    jdArg: string | undefined,
    onChunk: (accumulated: string) => void,
  ): Promise<string> {
    const res = await fetch("/api/interview/dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages, topic: topicArg, difficulty: difficultyArg, jd: jdArg }),
    });

    if (!res.ok || !res.body) {
      let message = `Request failed: ${res.status}`;
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch {
        // response wasn't JSON (e.g. a network-level failure) — keep the fallback
      }
      throw new Error(message);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      onChunk(full);
    }

    return full;
  }

  // ── Start interview ──────────────────────────────────────────────────────────

  // Shared by the normal setup flow and the Quick-Practice handoff — only the
  // kickoff text and topic/difficulty/jd differ.
  async function beginChat(kickoffContent: string, topicArg: string, difficultyArg: string, jdArg?: string) {
    setError("");
    setFeedback(null);
    setVisibleMessages([]);

    const kickoff: Message = { role: "user", content: kickoffContent };
    apiHistoryRef.current = [kickoff];

    setScreen("chat");
    setStreaming(true);

    // Placeholder for Hari's opening question
    setVisibleMessages([{ role: "assistant", content: "" }]);

    try {
      const devText = await fetchStream(apiHistoryRef.current, topicArg, difficultyArg, jdArg, (acc) => {
        setVisibleMessages([{ role: "assistant", content: acc }]);
      });

      apiHistoryRef.current = [kickoff, { role: "assistant", content: devText }];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reach Hari. Check your connection and try again.");
      setScreen("setup");
    } finally {
      setStreaming(false);
    }
  }

  function startInterview() {
    if (mode === "jd") {
      const trimmed = jdText.trim();
      if (!trimmed) {
        setJdError("Paste a job description to get started.");
        return;
      }
      if (trimmed.length < JD_MIN_LENGTH) {
        setJdError(`That's too short to work with — paste more of the actual job posting (at least ${JD_MIN_LENGTH} characters).`);
        return;
      }
      setJdError("");
      setActiveJd(trimmed);
      setRoleLabel(extractJdTitle(trimmed));
      beginChat(
        `Hi Hari! I'd like to practice for this role at ${difficulty} level. I've pasted the job description — please read it, then ask me your first question grounded in what it actually asks for.`,
        topic,
        difficulty,
        trimmed,
      );
      return;
    }
    beginChat(
      `Hi Hari! I'm ready for my ${topic} interview at ${difficulty} level. Please ask me your first question.`,
      topic,
      difficulty,
    );
  }

  // Quick-Practice handoff: skip setup, open directly framed around the
  // question/answer/insight the user already saw.
  function startWithContext(ctx: DevHandoffContext) {
    const validDifficulty: Difficulty = (DIFFICULTIES as readonly string[]).includes(ctx.difficulty)
      ? (ctx.difficulty as Difficulty)
      : "Intermediate";
    setCameFromPractice(true);
    setTopic(ctx.topic);
    setDifficulty(validDifficulty);
    beginChat(buildContextKickoff(ctx), ctx.topic, validDifficulty);
  }

  useEffect(() => {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (raw) {
      sessionStorage.removeItem(HANDOFF_KEY);
      try {
        startWithContext(JSON.parse(raw) as DevHandoffContext);
      } catch {
        // malformed/stale context — fall through to the normal setup screen
      }
    }
    setCheckingHandoff(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Send user message ────────────────────────────────────────────────────────

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming || micState !== "idle") return;
    cancelRecording();
    setIsLiveText(false);
    setInput("");
    setError("");

    const userMsg: Message = { role: "user", content: text };
    const nextApiHistory = [...apiHistoryRef.current, userMsg];
    apiHistoryRef.current = nextApiHistory;

    setVisibleMessages((prev) => [
      ...prev,
      userMsg,
      { role: "assistant", content: "" },
    ]);
    setStreaming(true);

    try {
      const devText = await fetchStream(nextApiHistory, topic, difficulty, activeJd ?? undefined, (acc) => {
        setVisibleMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: acc },
        ]);
      });

      apiHistoryRef.current = [...nextApiHistory, { role: "assistant", content: devText }];

      // Switch to feedback screen if Hari's response contains structured feedback
      if (isFeedbackTurn(devText)) {
        const parsed = parseFeedback(devText);
        setFeedback(parsed);
        setScreen("feedback");
      }
    } catch {
      setVisibleMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Voice input ──────────────────────────────────────────────────────────────
  // Same hybrid system as Quick Practice: MediaRecorder + Groq Whisper for
  // the accurate final transcript, Web Speech API for rough live captions
  // while speaking. Indian English locale and the DevOps term-correction
  // dictionary carry over from this page's earlier Web Speech-only version.

  function handleLiveText(liveTranscript: string) {
    setIsLiveText(true);
    voiceUpdateRef.current = true;
    setInput(baseInputRef.current ? `${baseInputRef.current} ${liveTranscript}` : liveTranscript);
  }

  function handleFinalText(finalTranscript: string) {
    setIsLiveText(false);
    voiceUpdateRef.current = true;
    setInput(baseInputRef.current ? `${baseInputRef.current} ${finalTranscript}` : finalTranscript);
  }

  const {
    micState,
    error: voiceError,
    toggleMic,
    cancelRecording,
  } = useVoiceRecorder("/api/interview/transcribe", handleLiveText, handleFinalText, {
    lang: "en-IN",
    correctText: correctVoice,
  });

  function handleMicToggle() {
    if (micState === "idle") {
      baseInputRef.current = input;
      setIsLiveText(true);
    }
    toggleMic();
  }

  // Avoid flashing the setup screen while we check for a Quick-Practice handoff
  if (checkingHandoff) return null;

  // ── Setup screen ─────────────────────────────────────────────────────────────

  if (screen === "setup") {
    return (
      <div className="dev-wrap">
        <div className="dev-avatar-ring">🤖</div>
        <h1 className="dev-title">Interview with Hari</h1>
        <p className="dev-subtitle">
          Hari is an AI mentor, trained on a real Lead DevOps Engineer&apos;s
          interview experience. {mode === "jd"
            ? "He'll ask enough questions to cover what this role actually needs, then give you honest feedback."
            : "He'll challenge you with real interview questions and give you honest feedback after 5–6 exchanges."}
        </p>

        {error && <p className="dev-error">{error}</p>}

        <div className="dev-mode-tabs">
          <button
            onClick={() => setMode("topic")}
            className={`dev-mode-tab${mode === "topic" ? " active" : ""}`}
          >
            Choose a topic
          </button>
          <button
            onClick={() => setMode("jd")}
            className={`dev-mode-tab${mode === "jd" ? " active" : ""}`}
          >
            Paste a job description
            <span className="dev-mode-badge">New</span>
          </button>
        </div>

        {mode === "topic" && (
          <p className="dev-jd-callout">
            ✨ New: paste a real job posting instead — Hari will tailor every
            question to that exact role.
          </p>
        )}

        {mode === "topic" ? (
          <>
            <p className="dev-label">Choose a topic</p>
            <div className="dev-topic-grid">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`dev-topic-btn${topic === t ? " active" : ""}`}
                >
                  <span className="dev-topic-code">{TOPIC_CODE[t]}</span>
                  {t}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="dev-jd-block">
            <p className="dev-label">Paste the job description</p>
            <textarea
              value={jdText}
              onChange={(e) => {
                setJdText(e.target.value.slice(0, JD_MAX_LENGTH));
                setJdError("");
              }}
              placeholder="Paste a real job posting here — Hari will read it and ask questions grounded in what it actually asks for…"
              rows={8}
              className="dev-jd-textarea"
            />
            <p className="dev-jd-counter">{jdText.length}/{JD_MAX_LENGTH}</p>
            {jdError && <p className="dev-error">{jdError}</p>}
          </div>
        )}

        <p className="dev-label">Difficulty</p>
        <div className="dev-pills">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`dev-pill${difficulty === d ? " active" : ""}`}
            >
              {d}
            </button>
          ))}
        </div>

        {mode === "topic" && priorTopicNudge && (
          <div className="dev-nudge">
            <span>
              You&apos;ve practiced {topic} before — <Link href="/pricing">upgrade to Pro</Link> so Hari
              remembers this and builds on it instead of starting fresh.
            </span>
            <button
              onClick={dismissPriorTopicNudge}
              className="dev-nudge-dismiss"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        <button onClick={startInterview} className="dev-start-btn">
          Start Interview →
        </button>

        <style>{`
          .dev-wrap {
            min-height: 100vh;
            background: var(--background);
            color: var(--foreground);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
          }
          .dev-avatar-ring {
            width: 80px; height: 80px;
            border-radius: 50%;
            background: var(--surface-2);
            border: 3px solid #F5A623;
            display: flex; align-items: center; justify-content: center;
            font-size: 2rem;
            margin-bottom: 1rem;
          }
          .dev-title { font-size: 1.875rem; font-weight: 700; margin: 0 0 0.35rem; }
          .dev-subtitle {
            color: var(--muted); text-align: center;
            max-width: 400px; margin: 0 0 2rem; line-height: 1.6;
          }
          .dev-error { color: #F87171; margin-bottom: 1rem; }
          .dev-label {
            font-size: 0.75rem; text-transform: uppercase;
            letter-spacing: 0.1em; color: var(--muted); margin-bottom: 0.6rem;
          }
          .dev-topic-grid {
            display: grid; grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem; width: 100%; max-width: 520px; margin-bottom: 1.5rem;
          }
          .dev-topic-btn {
            padding: 0.75rem 0.4rem; border-radius: 10px;
            border: 2px solid transparent;
            background: var(--surface); color: var(--muted);
            font-size: 0.8rem; cursor: pointer; transition: all 0.15s;
            display: flex; flex-direction: column; align-items: center; gap: 2px;
          }
          .dev-topic-btn.active {
            border-color: #F5A623; background: var(--surface-2);
            color: var(--accent-text); font-weight: 700;
          }
          .dev-topic-code { font-family: monospace; font-size: 0.6rem; opacity: 0.6; }
          .dev-mode-tabs {
            display: flex; gap: 0.6rem; margin-bottom: 0.85rem;
            width: 100%; max-width: 520px;
          }
          .dev-mode-tab {
            flex: 1; padding: 0.7rem 1rem; border-radius: 12px;
            border: 2px solid var(--scrollbar-thumb);
            background: var(--surface); color: var(--muted);
            font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
            display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          }
          .dev-mode-tab:hover { border-color: var(--muted); }
          .dev-mode-tab.active {
            border-color: #F5A623; background: var(--surface-2);
            color: var(--accent-text); font-weight: 700;
          }
          .dev-mode-badge {
            font-size: 0.6rem; font-weight: 800; letter-spacing: 0.04em;
            text-transform: uppercase; color: var(--accent-contrast); background: #F5A623;
            padding: 0.15rem 0.4rem; border-radius: 999px; line-height: 1.4;
          }
          .dev-jd-callout {
            width: 100%; max-width: 520px;
            padding: 0.6rem 0.9rem; margin: 0 0 1.25rem;
            font-size: 0.78rem; line-height: 1.5; color: var(--accent-text);
            background: rgba(245,166,35,0.1);
            border: 1px solid rgba(245,166,35,0.25);
            border-radius: 10px; text-align: center;
          }
          .dev-jd-block { width: 100%; max-width: 520px; margin-bottom: 1.5rem; }
          .dev-jd-textarea {
            width: 100%; min-height: 160px;
            background: var(--surface); border: 1px solid var(--scrollbar-thumb); border-radius: 12px;
            color: var(--foreground); padding: 0.75rem 1rem;
            font-size: 0.875rem; line-height: 1.6; resize: vertical;
            outline: none; font-family: inherit;
          }
          .dev-jd-textarea:focus { border-color: #F5A623; }
          .dev-jd-counter {
            text-align: right; font-size: 0.7rem; color: var(--muted); margin: 0.35rem 0 0;
          }
          .dev-pills { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
          .dev-pill {
            padding: 0.5rem 1.25rem; border-radius: 999px;
            border: 2px solid transparent;
            background: var(--surface); color: var(--muted);
            font-size: 0.875rem; cursor: pointer; transition: all 0.15s;
          }
          .dev-pill.active {
            border-color: #F5A623; background: var(--surface-2);
            color: var(--accent-text); font-weight: 600;
          }
          .dev-start-btn {
            padding: 0.875rem 2.5rem; border-radius: 12px;
            background: #F5A623; color: var(--accent-contrast);
            font-weight: 700; font-size: 1rem; border: none; cursor: pointer;
            transition: opacity 0.15s;
          }
          .dev-start-btn:hover { opacity: 0.9; }
          .dev-nudge {
            display: flex; align-items: center; gap: 0.75rem;
            width: 100%; max-width: 520px;
            padding: 0.75rem 1rem; margin-bottom: 1.5rem;
            font-size: 0.8rem; line-height: 1.5; color: var(--accent-text);
            background: rgba(245,166,35,0.1);
            border: 1px solid rgba(245,166,35,0.25);
            border-radius: 10px;
          }
          .dev-nudge span { flex: 1; }
          .dev-nudge a { color: var(--accent-text); font-weight: 700; text-decoration: underline; }
          .dev-nudge-dismiss {
            flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
            background: transparent; border: none; color: var(--accent-text);
            font-size: 1.1rem; line-height: 1; cursor: pointer; opacity: 0.7;
          }
          .dev-nudge-dismiss:hover { opacity: 1; }
        `}</style>
      </div>
    );
  }

  // ── Feedback screen ──────────────────────────────────────────────────────────

  if (screen === "feedback" && feedback) {
    const scoreNum = parseInt(feedback.score.split("/")[0]) || 0;
    const scoreColor =
      scoreNum >= 7 ? "#4ADE80" : scoreNum >= 5 ? "#F5A623" : "#F87171";

    return (
      <div className="fb-wrap">
        <div className="fb-inner">
          <div className="fb-score-ring" style={{ color: scoreColor }}>
            {feedback.score}
          </div>
          <p className="fb-byline">Hari&apos;s honest feedback · {mode === "jd" ? roleLabel : topic}</p>

          {[
            { label: "What You Did Well", value: feedback.strong, icon: "✅", bg: "#4ADE8018", border: "#4ADE8033" },
            { label: "What To Improve", value: feedback.improve, icon: "📈", bg: "#F5A62318", border: "#F5A62333" },
            { label: "Senior Engineer Answer", value: feedback.seniorAnswer, icon: "🧠", bg: "#818CF818", border: "#818CF833" },
          ].map(({ label, value, icon, bg, border }) => (
            <div key={label} className="fb-card" style={{ background: bg, borderColor: border }}>
              <p className="fb-card-label">{icon} {label}</p>
              <p className="fb-card-body">{value || "—"}</p>
            </div>
          ))}

          <button
            onClick={() => { setScreen("setup"); setVisibleMessages([]); setFeedback(null); }}
            className="fb-restart-btn"
          >
            Practice Again
          </button>
        </div>

        <style>{`
          .fb-wrap {
            min-height: 100vh; background: var(--background); color: var(--foreground);
            display: flex; flex-direction: column; align-items: center;
            padding: 3rem 1rem;
          }
          .fb-inner { width: 100%; max-width: 640px; }
          .fb-score-ring {
            font-size: 4rem; font-weight: 900; text-align: center;
            margin-bottom: 0.25rem;
          }
          .fb-byline { color: var(--muted); text-align: center; margin: 0 0 1.75rem; }
          .fb-card {
            border-radius: 12px; border: 1px solid;
            padding: 1.25rem; margin-bottom: 1rem;
          }
          .fb-card-label {
            font-size: 0.7rem; text-transform: uppercase;
            letter-spacing: 0.1em; color: var(--muted); margin: 0 0 0.5rem;
          }
          .fb-card-body { line-height: 1.7; margin: 0; white-space: pre-wrap; }
          .fb-restart-btn {
            width: 100%; padding: 0.875rem; border-radius: 12px;
            background: #F5A623; color: var(--accent-contrast);
            font-weight: 700; font-size: 1rem; border: none; cursor: pointer;
            margin-top: 0.5rem; transition: opacity 0.15s;
          }
          .fb-restart-btn:hover { opacity: 0.9; }
        `}</style>
      </div>
    );
  }

  // ── Chat screen ──────────────────────────────────────────────────────────────

  return (
    <div className="chat-root">
      {/* Back to Quick Practice — only shown when this chat came from that
          handoff; a manually-started session has nothing to return to. */}
      {cameFromPractice && (
        <Link href="/interview/practice" className="chat-back-link">
          ← Back to your practice session
        </Link>
      )}

      {/* Header */}
      <div className="chat-header">
        <div className="chat-avatar">🤖</div>
        <div>
          <p className="chat-dev-name">Hari</p>
          <p className="chat-dev-role">AI Mentor · trained on Hari&apos;s interview experience</p>
        </div>
        <div className="chat-badges">
          <span className="chat-badge gold">{mode === "jd" ? roleLabel : topic}</span>
          <span className="chat-badge muted">{difficulty}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {/* Pushed to the bottom of the scroll container via margin-top:auto —
            keeps a short conversation hugging the input instead of floating
            near the top, without the classic flexbox trap where combining
            overflow-y:auto with justify-content:flex-end on the same element
            makes overflow content unscrollable once it's taller than the
            viewport. */}
        <div className="chat-messages-inner">
          {visibleMessages.map((msg, i) => {
            const isLast = i === visibleMessages.length - 1;
            const isPlaceholder = msg.role === "assistant" && msg.content === "" && streaming && isLast;

            return (
              <div
                key={i}
                className={`chat-row ${msg.role === "user" ? "user-row" : "dev-row"}`}
              >
                {msg.role === "assistant" && (
                  <div className="chat-bubble-avatar">🤖</div>
                )}
                <div className={`chat-bubble ${msg.role === "user" ? "user-bubble" : "dev-bubble"}`}>
                  {isPlaceholder ? (
                    <span className="chat-typing">●●●</span>
                  ) : msg.role === "assistant" ? (
                    stripMarkdown(msg.content)
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            );
          })}
          {(error || voiceError) && <p className="chat-error">{error || voiceError}</p>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <MicButton micState={micState} onToggle={handleMicToggle} />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setIsLiveText(false);
          }}
          onKeyDown={handleKeyDown}
          onPaste={blockPaste}
          onDrop={blockPaste}
          placeholder="Type your answer… or press the mic"
          rows={3}
          disabled={streaming}
          className="chat-textarea"
          style={{ fontStyle: isLiveText ? "italic" : "normal", opacity: isLiveText ? 0.7 : 1 }}
        />
        <div className="chat-actions">
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming || micState !== "idle"}
            className="chat-icon-btn chat-send-btn"
          >
            ↑
          </button>
        </div>
      </div>
      {pasteBlocked && (
        <p className="chat-paste-blocked">
          Paste is disabled here — type your answer to practice for the real thing.
        </p>
      )}

      <style>{`
        .chat-root {
          height: 100%; background: var(--background); color: var(--foreground);
          display: flex; flex-direction: column;
        }
        .chat-back-link {
          display: block; flex-shrink: 0;
          padding: 0.6rem 1.25rem;
          font-size: 0.8rem; color: var(--muted);
          background: var(--background); border-bottom: 1px solid var(--surface-2);
          text-decoration: none; transition: color 0.15s;
        }
        .chat-back-link:hover { color: var(--accent-text); }
        .chat-header {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--surface-2);
          background: var(--background); flex-shrink: 0;
        }
        .chat-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--surface-2); border: 2px solid #F5A623;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; flex-shrink: 0;
        }
        .chat-dev-name { font-weight: 700; color: var(--foreground); margin: 0; font-size: 0.9rem; }
        .chat-dev-role { font-size: 0.7rem; color: var(--muted); margin: 0; }
        .chat-badges { margin-left: auto; display: flex; gap: 0.5rem; }
        .chat-badge {
          padding: 0.2rem 0.65rem; border-radius: 999px;
          font-size: 0.7rem; font-weight: 600;
        }
        .chat-badge.gold { background: var(--surface-2); color: var(--accent-text); }
        .chat-badge.muted { background: var(--surface); color: var(--muted); }

        .chat-messages {
          flex: 1; min-height: 0; overflow-y: auto;
          padding: 1.25rem;
          display: flex; flex-direction: column;
        }
        .chat-messages-inner {
          display: flex; flex-direction: column; gap: 1rem;
          margin-top: auto;
        }
        .chat-row { display: flex; align-items: flex-end; gap: 0.5rem; }
        .user-row { justify-content: flex-end; }
        .dev-row { justify-content: flex-start; }
        .chat-bubble-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--surface-2); border: 1px solid #F5A623;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; flex-shrink: 0;
        }
        .chat-bubble {
          max-width: 75%; padding: 0.875rem 1rem;
          line-height: 1.7; white-space: pre-wrap;
          font-size: 0.9rem; color: var(--foreground);
        }
        .dev-bubble {
          background: var(--surface-2);
          border-radius: 16px 16px 16px 4px;
        }
        .user-bubble {
          background: var(--scrollbar-thumb);
          border-radius: 16px 16px 4px 16px;
        }
        .chat-typing { opacity: 0.4; letter-spacing: 3px; }
        .chat-error { color: #F87171; font-size: 0.85rem; text-align: center; }

        .chat-input-area {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--surface-2);
          background: var(--background);
          display: flex; gap: 0.75rem; align-items: flex-end; flex-shrink: 0;
        }
        .chat-textarea {
          flex: 1; background: var(--surface);
          border: 1px solid var(--scrollbar-thumb); border-radius: 12px;
          color: var(--foreground); padding: 0.75rem 1rem;
          font-size: 0.9rem; resize: none; outline: none;
          line-height: 1.5; font-family: inherit;
          transition: opacity 200ms ease-out;
          min-height: calc(2 * 0.75rem + 3 * 1.5em);
          max-height: min(50vh, 360px); overflow-y: auto;
        }
        .chat-textarea:focus { border-color: #F5A623; }
        .chat-paste-blocked {
          margin: 0 1.25rem 0.75rem;
          padding: 0.6rem 0.9rem;
          font-size: 0.8rem; color: var(--accent-text);
          background: rgba(245,166,35,0.1);
          border: 1px solid rgba(245,166,35,0.25);
          border-radius: 8px;
          flex-shrink: 0;
        }
        .chat-actions { display: flex; flex-direction: column; gap: 0.5rem; }
        .chat-icon-btn {
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--surface-2); border: 2px solid var(--scrollbar-thumb);
          color: var(--muted); font-size: 1.1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .chat-send-btn:not(:disabled) {
          background: #F5A623; border-color: #F5A623; color: var(--accent-contrast);
        }
        .chat-send-btn:disabled { cursor: not-allowed; opacity: 0.4; }
      `}</style>
    </div>
  );
}
