"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function parseFeedback(text: string): FeedbackData {
  // Strip markdown from the whole response first. The model sometimes bolds the
  // field labels themselves (e.g. "**STRONG:**\nbody..." instead of the requested
  // "STRONG: body"), which previously broke label matching and left the body on
  // its own line, undetected by the old single-line field regexes.
  const clean = stripMarkdown(text);
  const score = clean.match(/SCORE:\s*(.+)/)?.[1]?.trim() ?? "";
  const strong = meaningful(
    clean.match(/STRONG:\s*([\s\S]*?)(?=\s*IMPROVE:|\s*SENIOR_ANSWER:|$)/)?.[1]?.trim() ?? ""
  );
  const improve = meaningful(
    clean.match(/IMPROVE:\s*([\s\S]*?)(?=\s*SENIOR_ANSWER:|$)/)?.[1]?.trim() ?? ""
  );
  const seniorAnswer = meaningful(
    clean.match(/SENIOR_ANSWER:\s*([\s\S]+)/)?.[1]?.trim() ?? ""
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
  const [topic, setTopic] = useState<string>("Docker");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");

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

  // Checks, per selected topic, whether this user has practiced it before —
  // only surfaces the nudge for FREE users (PRO doesn't need it, it gets
  // real memory instead). Runs on the setup screen only.
  useEffect(() => {
    if (checkingHandoff || screen !== "setup") return;
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
  }, [topic, screen, checkingHandoff]);

  function dismissPriorTopicNudge() {
    dismissedNudgeTopicsRef.current.add(topic);
    setPriorTopicNudge(false);
  }

  // ── Streaming fetch ──────────────────────────────────────────────────────────

  async function fetchStream(
    apiMessages: Message[],
    topicArg: string,
    difficultyArg: string,
    onChunk: (accumulated: string) => void,
  ): Promise<string> {
    const res = await fetch("/api/interview/dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages, topic: topicArg, difficulty: difficultyArg }),
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
  // kickoff text and topic/difficulty differ.
  async function beginChat(kickoffContent: string, topicArg: string, difficultyArg: string) {
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
      const devText = await fetchStream(apiHistoryRef.current, topicArg, difficultyArg, (acc) => {
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
      const devText = await fetchStream(nextApiHistory, topic, difficulty, (acc) => {
        setVisibleMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: acc },
        ]);
      });

      apiHistoryRef.current = [...nextApiHistory, { role: "assistant", content: devText }];

      // Switch to feedback screen if Hari's response contains structured feedback
      if (devText.includes("SCORE:") && devText.includes("SENIOR_ANSWER:")) {
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
    setInput(baseInputRef.current ? `${baseInputRef.current} ${liveTranscript}` : liveTranscript);
  }

  function handleFinalText(finalTranscript: string) {
    setIsLiveText(false);
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
          interview experience. He&apos;ll challenge you with real interview
          questions and give you honest feedback after 5–6 exchanges.
        </p>

        {error && <p className="dev-error">{error}</p>}

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

        {priorTopicNudge && (
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
            background: #1C1917;
            color: #E7DDD5;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
          }
          .dev-avatar-ring {
            width: 80px; height: 80px;
            border-radius: 50%;
            background: #2C2420;
            border: 3px solid #F5A623;
            display: flex; align-items: center; justify-content: center;
            font-size: 2rem;
            margin-bottom: 1rem;
          }
          .dev-title { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.35rem; }
          .dev-subtitle {
            color: #9E8E85; text-align: center;
            max-width: 400px; margin: 0 0 2rem; line-height: 1.6;
          }
          .dev-error { color: #F87171; margin-bottom: 1rem; }
          .dev-label {
            font-size: 0.75rem; text-transform: uppercase;
            letter-spacing: 0.1em; color: #9E8E85; margin-bottom: 0.6rem;
          }
          .dev-topic-grid {
            display: grid; grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem; width: 100%; max-width: 520px; margin-bottom: 1.5rem;
          }
          .dev-topic-btn {
            padding: 0.75rem 0.4rem; border-radius: 10px;
            border: 2px solid transparent;
            background: #23201E; color: #C9B8AE;
            font-size: 0.8rem; cursor: pointer; transition: all 0.15s;
            display: flex; flex-direction: column; align-items: center; gap: 2px;
          }
          .dev-topic-btn.active {
            border-color: #F5A623; background: #2C2420;
            color: #F5A623; font-weight: 700;
          }
          .dev-topic-code { font-family: monospace; font-size: 0.6rem; opacity: 0.6; }
          .dev-pills { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
          .dev-pill {
            padding: 0.5rem 1.25rem; border-radius: 999px;
            border: 2px solid transparent;
            background: #23201E; color: #9E8E85;
            font-size: 0.875rem; cursor: pointer; transition: all 0.15s;
          }
          .dev-pill.active {
            border-color: #F5A623; background: #2C2420;
            color: #F5A623; font-weight: 600;
          }
          .dev-start-btn {
            padding: 0.875rem 2.5rem; border-radius: 12px;
            background: #F5A623; color: #1C1917;
            font-weight: 700; font-size: 1rem; border: none; cursor: pointer;
            transition: opacity 0.15s;
          }
          .dev-start-btn:hover { opacity: 0.9; }
          .dev-nudge {
            display: flex; align-items: center; gap: 0.75rem;
            width: 100%; max-width: 520px;
            padding: 0.75rem 1rem; margin-bottom: 1.5rem;
            font-size: 0.8rem; line-height: 1.5; color: #F5A623;
            background: rgba(245,166,35,0.1);
            border: 1px solid rgba(245,166,35,0.25);
            border-radius: 10px;
          }
          .dev-nudge span { flex: 1; }
          .dev-nudge a { color: #F5A623; font-weight: 700; text-decoration: underline; }
          .dev-nudge-dismiss {
            flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
            background: transparent; border: none; color: #F5A623;
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
          <p className="fb-byline">Hari&apos;s honest feedback</p>

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
            min-height: 100vh; background: #1C1917; color: #E7DDD5;
            display: flex; flex-direction: column; align-items: center;
            padding: 3rem 1rem;
          }
          .fb-inner { width: 100%; max-width: 640px; }
          .fb-score-ring {
            font-size: 4rem; font-weight: 900; text-align: center;
            margin-bottom: 0.25rem;
          }
          .fb-byline { color: #9E8E85; text-align: center; margin: 0 0 1.75rem; }
          .fb-card {
            border-radius: 12px; border: 1px solid;
            padding: 1.25rem; margin-bottom: 1rem;
          }
          .fb-card-label {
            font-size: 0.7rem; text-transform: uppercase;
            letter-spacing: 0.1em; color: #9E8E85; margin: 0 0 0.5rem;
          }
          .fb-card-body { line-height: 1.7; margin: 0; white-space: pre-wrap; }
          .fb-restart-btn {
            width: 100%; padding: 0.875rem; border-radius: 12px;
            background: #F5A623; color: #1C1917;
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
          <span className="chat-badge gold">{topic}</span>
          <span className="chat-badge muted">{difficulty}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
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

      {/* Input area */}
      <div className="chat-input-area">
        <MicButton micState={micState} onToggle={handleMicToggle} />
        <textarea
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
          height: 100%; background: #1C1917; color: #E7DDD5;
          display: flex; flex-direction: column;
        }
        .chat-back-link {
          display: block; flex-shrink: 0;
          padding: 0.6rem 1.25rem;
          font-size: 0.8rem; color: #9E8E85;
          background: #1C1917; border-bottom: 1px solid #2C2420;
          text-decoration: none; transition: color 0.15s;
        }
        .chat-back-link:hover { color: #F5A623; }
        .chat-header {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid #2C2420;
          background: #1C1917; flex-shrink: 0;
        }
        .chat-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: #2C2420; border: 2px solid #F5A623;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; flex-shrink: 0;
        }
        .chat-dev-name { font-weight: 700; color: #E7DDD5; margin: 0; font-size: 0.9rem; }
        .chat-dev-role { font-size: 0.7rem; color: #9E8E85; margin: 0; }
        .chat-badges { margin-left: auto; display: flex; gap: 0.5rem; }
        .chat-badge {
          padding: 0.2rem 0.65rem; border-radius: 999px;
          font-size: 0.7rem; font-weight: 600;
        }
        .chat-badge.gold { background: #2C2420; color: #F5A623; }
        .chat-badge.muted { background: #23201E; color: #9E8E85; }

        .chat-messages {
          flex: 1; overflow-y: auto; padding: 1.25rem;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .chat-row { display: flex; align-items: flex-end; gap: 0.5rem; }
        .user-row { justify-content: flex-end; }
        .dev-row { justify-content: flex-start; }
        .chat-bubble-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: #2C2420; border: 1px solid #F5A623;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; flex-shrink: 0;
        }
        .chat-bubble {
          max-width: 75%; padding: 0.875rem 1rem;
          line-height: 1.7; white-space: pre-wrap;
          font-size: 0.9rem; color: #E7DDD5;
        }
        .dev-bubble {
          background: #2C2420;
          border-radius: 16px 16px 16px 4px;
        }
        .user-bubble {
          background: #3D3530;
          border-radius: 16px 16px 4px 16px;
        }
        .chat-typing { opacity: 0.4; letter-spacing: 3px; }
        .chat-error { color: #F87171; font-size: 0.85rem; text-align: center; }

        .chat-input-area {
          padding: 1rem 1.25rem;
          border-top: 1px solid #2C2420;
          background: #1C1917;
          display: flex; gap: 0.75rem; align-items: flex-end; flex-shrink: 0;
        }
        .chat-textarea {
          flex: 1; background: #23201E;
          border: 1px solid #3D3530; border-radius: 12px;
          color: #E7DDD5; padding: 0.75rem 1rem;
          font-size: 0.9rem; resize: none; outline: none;
          line-height: 1.5; font-family: inherit;
          transition: opacity 200ms ease-out;
        }
        .chat-textarea:focus { border-color: #F5A623; }
        .chat-paste-blocked {
          margin: 0 1.25rem 0.75rem;
          padding: 0.6rem 0.9rem;
          font-size: 0.8rem; color: #F5A623;
          background: rgba(245,166,35,0.1);
          border: 1px solid rgba(245,166,35,0.25);
          border-radius: 8px;
          flex-shrink: 0;
        }
        .chat-actions { display: flex; flex-direction: column; gap: 0.5rem; }
        .chat-icon-btn {
          width: 44px; height: 44px; border-radius: 50%;
          background: #2C2420; border: 2px solid #3D3530;
          color: #9E8E85; font-size: 1.1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .chat-send-btn:not(:disabled) {
          background: #F5A623; border-color: #F5A623; color: #1C1917;
        }
        .chat-send-btn:disabled { cursor: not-allowed; opacity: 0.4; }
      `}</style>
    </div>
  );
}
