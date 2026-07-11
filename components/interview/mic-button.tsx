"use client";

import type { MicState } from "./use-voice-recorder";

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

export default function MicButton({ micState, onToggle }: { micState: MicState; onToggle: () => void }) {
  const recording = micState === "recording";
  const transcribing = micState === "transcribing";

  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      <button
        onClick={onToggle}
        disabled={transcribing}
        aria-label={recording ? "Stop recording" : transcribing ? "Transcribing" : "Start voice input"}
        className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0E1A] disabled:cursor-not-allowed"
        style={{
          backgroundColor: recording ? "#EF4444" : transcribing ? "#2C2420" : "rgba(245,166,35,0.12)",
          border: recording
            ? "2px solid #EF4444"
            : transcribing
            ? "2px solid rgba(255,255,255,0.15)"
            : "2px solid rgba(245,166,35,0.4)",
          color: recording ? "#fff" : transcribing ? "#9CA3AF" : "#F5A623",
        }}
      >
        {recording && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ backgroundColor: "rgba(239,68,68,0.35)" }}
          />
        )}
        {transcribing ? (
          <svg className="w-5 h-5 animate-spin relative z-10" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <MicIcon className="w-5 h-5 relative z-10" />
        )}
      </button>
      <p className="text-xs text-gray-500">
        {recording ? "Click to stop recording" : transcribing ? "Transcribing…" : "Click to speak your answer"}
      </p>
    </div>
  );
}
