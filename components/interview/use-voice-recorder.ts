"use client";

import { useRef, useState, useCallback } from "react";

export type MicState = "idle" | "recording" | "transcribing";

type SpeechRecognitionResultLike = { isFinal: boolean; [index: number]: { transcript: string } };
type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

// Stable reference so the default doesn't defeat useCallback memoization
// below by producing a new function identity on every render.
function identity(text: string): string {
  return text;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Records audio via MediaRecorder for an accurate server-side Whisper (Groq)
// transcript on stop. In parallel, a best-effort Web Speech API layer shows
// rough live captions as the user speaks — purely a placeholder, always
// superseded by the Groq transcript the instant it lands. continuous +
// interimResults are set from the start so recognition doesn't cut off after
// a pause (the bug in the old live-only implementation); if it errors out or
// isn't supported at all (e.g. Safari), it just silently stops contributing
// live text — the Groq path is unaffected either way.
export function useVoiceRecorder(
  endpoint: string,
  onLiveText: (text: string) => void,
  onFinalText: (text: string) => void,
  options?: {
    // Web Speech recognition locale — defaults to "en-US". Callers with a
    // different primary audience (e.g. Indian English) can override this.
    lang?: string;
    // Optional post-processing applied to both live and final text before
    // it's handed to the callbacks above — e.g. a domain term-correction
    // dictionary. Identity by default.
    correctText?: (text: string) => string;
  }
) {
  const lang = options?.lang ?? "en-US";
  const correctText = options?.correctText ?? identity;
  const [micState, setMicState] = useState<MicState>("idle");
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Set by cancelRecording so an in-flight stop/transcribe from a *previous*
  // question can't land its transcript on the *next* question's answer.
  const cancelledRef = useRef(false);

  const startRecording = useCallback(async () => {
    setError("");
    cancelledRef.current = false;

    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Voice input requires a browser with microphone support.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access was denied or unavailable.");
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined;
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      chunksRef.current = [];

      if (cancelledRef.current || blob.size === 0) {
        setMicState("idle");
        return;
      }

      setMicState("transcribing");
      try {
        const form = new FormData();
        form.append("audio", blob);
        const res = await fetch(endpoint, { method: "POST", body: form });
        const data = await res.json();
        if (cancelledRef.current) return;
        if (!res.ok) {
          setError(data?.error ?? "Transcription failed. Please try again.");
        } else if (typeof data.text === "string" && data.text.trim()) {
          onFinalText(correctText(data.text.trim()));
        }
      } catch {
        if (!cancelledRef.current) {
          setError("Transcription failed. Please check your connection and try again.");
        }
      } finally {
        setMicState("idle");
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();

    // Best-effort live captions — never authoritative, ignored entirely if
    // unsupported or if anything goes wrong.
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (SpeechRecognitionCtor) {
      try {
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onresult = (event) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (!cancelledRef.current) onLiveText(correctText(transcript.trim()));
        };
        // "no-speech" and other errors are common and non-fatal for a
        // best-effort layer — just stop contributing live text quietly.
        // onend follows either way, which is where restart is decided.
        recognition.onerror = () => {};
        recognition.onend = () => {
          // Some browsers end a recognition session on their own — a pause
          // in speech, an internal timeout — even with continuous=true.
          // Without this, the live captions silently freeze while the user
          // keeps talking, they think the mic died, and clicking it (since
          // micState is still "recording") actually stops the real
          // MediaRecorder mid-answer. Restart transparently unless the user
          // has genuinely stopped/cancelled: stopRecording/cancelRecording
          // both null mediaRecorderRef *before* calling recognition.stop(),
          // so its absence here reliably means an intentional stop, not an
          // unexpected one.
          if (cancelledRef.current || !mediaRecorderRef.current) {
            recognitionRef.current = null;
            return;
          }
          try {
            recognition.start();
          } catch {
            recognitionRef.current = null;
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        recognitionRef.current = null;
      }
    }

    setMicState("recording");
  }, [endpoint, onFinalText, onLiveText, lang, correctText]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    try {
      recognitionRef.current?.stop();
    } catch {
      // already stopped/ended — nothing to do
    }
    recognitionRef.current = null;
  }, []);

  // Discards any in-progress recording or in-flight transcription without
  // applying its result — for navigating away (next question, restart)
  // mid-recording, as opposed to the user intentionally finishing an answer.
  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    try {
      recognitionRef.current?.stop();
    } catch {
      // already stopped/ended — nothing to do
    }
    recognitionRef.current = null;
    setMicState("idle");
  }, []);

  const toggleMic = useCallback(() => {
    if (micState === "recording") stopRecording();
    else if (micState === "idle") startRecording();
  }, [micState, startRecording, stopRecording]);

  return { micState, error, toggleMic, cancelRecording };
}
