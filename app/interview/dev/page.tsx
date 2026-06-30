"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen = "setup" | "chat" | "feedback";

type Message = { role: "user" | "assistant"; content: string };

interface FeedbackData {
  score: string;
  strong: string;
  improve: string;
  seniorAnswer: string;
}

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

// ── Web Speech API types ───────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseFeedback(text: string): FeedbackData {
  const score = text.match(/SCORE:\s*(.+)/)?.[1]?.trim() ?? "";
  const strong = text.match(/STRONG:\s*(.+)/)?.[1]?.trim() ?? "";
  const improve = text.match(/IMPROVE:\s*(.+)/)?.[1]?.trim() ?? "";
  const seniorAnswer = text.match(/SENIOR_ANSWER:\s*([\s\S]+)/)?.[1]?.trim() ?? "";
  return { score, strong, improve, seniorAnswer };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DevInterviewPage() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [topic, setTopic] = useState<string>("Docker");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");

  // Visible messages only — the kickoff user message is hidden from the UI
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [error, setError] = useState("");

  // Full API conversation history (includes the hidden kickoff)
  const apiHistoryRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseTextRef = useRef("");
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages]);

  // ── Streaming fetch ──────────────────────────────────────────────────────────

  async function fetchStream(
    apiMessages: Message[],
    onChunk: (accumulated: string) => void,
  ): Promise<string> {
    const res = await fetch("/api/interview/dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages, topic, difficulty }),
    });

    if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);

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

  async function startInterview() {
    setError("");
    setFeedback(null);
    setVisibleMessages([]);

    const kickoff: Message = {
      role: "user",
      content: `Hi Dev! I'm ready for my ${topic} interview at ${difficulty} level. Please ask me your first question.`,
    };
    apiHistoryRef.current = [kickoff];

    setScreen("chat");
    setStreaming(true);

    // Placeholder for Dev's opening question
    setVisibleMessages([{ role: "assistant", content: "" }]);

    try {
      const devText = await fetchStream(apiHistoryRef.current, (acc) => {
        setVisibleMessages([{ role: "assistant", content: acc }]);
      });

      apiHistoryRef.current = [kickoff, { role: "assistant", content: devText }];
    } catch {
      setError("Couldn't reach Dev. Check your connection and try again.");
      setScreen("setup");
    } finally {
      setStreaming(false);
    }
  }

  // ── Send user message ────────────────────────────────────────────────────────

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;
    if (isListening) stopListening();
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
      const devText = await fetchStream(nextApiHistory, (acc) => {
        setVisibleMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: acc },
        ]);
      });

      apiHistoryRef.current = [...nextApiHistory, { role: "assistant", content: devText }];

      // Switch to feedback screen if Dev's response contains structured feedback
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
      setError("Voice input requires Chrome or Edge.");
      return;
    }

    baseTextRef.current = input;
    finalTranscriptRef.current = "";

    const recognition = new SR() as SpeechRecognitionInstance;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscriptRef.current += t;
        else interim += t;
      }
      setInput(
        baseTextRef.current +
          finalTranscriptRef.current +
          (interim ? " " + interim : ""),
      );
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
  }, [input]);

  function toggleMic() {
    if (isListening) stopListening();
    else startListening();
  }

  // ── Setup screen ─────────────────────────────────────────────────────────────

  if (screen === "setup") {
    return (
      <div className="dev-wrap">
        <div className="dev-avatar-ring">🤖</div>
        <h1 className="dev-title">Interview with Dev</h1>
        <p className="dev-subtitle">
          Dev is a Senior DevOps Mentor who&apos;ll challenge you with real
          interview questions and give you honest feedback after 5–6 exchanges.
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
          <p className="fb-byline">Dev&apos;s honest feedback</p>

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
      {/* Header */}
      <div className="chat-header">
        <div className="chat-avatar">🤖</div>
        <div>
          <p className="chat-dev-name">Dev</p>
          <p className="chat-dev-role">Senior DevOps Mentor</p>
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
                ) : (
                  msg.content
                )}
              </div>
            </div>
          );
        })}
        {error && <p className="chat-error">{error}</p>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer… or press the mic"
          rows={3}
          disabled={streaming}
          className="chat-textarea"
        />
        <div className="chat-actions">
          <button
            onClick={toggleMic}
            className={`chat-icon-btn${isListening ? " mic-active" : ""}`}
            title={isListening ? "Stop recording" : "Start voice input"}
          >
            🎤
          </button>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="chat-icon-btn chat-send-btn"
          >
            ↑
          </button>
        </div>
      </div>

      <style>{`
        .chat-root {
          height: 100vh; background: #1C1917; color: #E7DDD5;
          display: flex; flex-direction: column;
        }
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
        }
        .chat-textarea:focus { border-color: #F5A623; }
        .chat-actions { display: flex; flex-direction: column; gap: 0.5rem; }
        .chat-icon-btn {
          width: 44px; height: 44px; border-radius: 50%;
          background: #2C2420; border: 2px solid #3D3530;
          color: #9E8E85; font-size: 1.1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .chat-icon-btn.mic-active {
          background: #F5A623; border-color: #F5A623; color: #1C1917;
        }
        .chat-send-btn:not(:disabled) {
          background: #F5A623; border-color: #F5A623; color: #1C1917;
        }
        .chat-send-btn:disabled { cursor: not-allowed; opacity: 0.4; }
      `}</style>
    </div>
  );
}
