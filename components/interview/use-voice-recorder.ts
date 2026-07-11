"use client";

import { useRef, useState, useCallback } from "react";

export type MicState = "idle" | "recording" | "transcribing";

// Records audio via MediaRecorder while the mic is active, then sends the
// whole clip to a server-side Whisper (Groq) transcription endpoint on stop —
// replaces the old live webkitSpeechRecognition flow, which transcribed
// as-you-speak but was unreliable on Indian English / DevOps terminology.
export function useVoiceRecorder(endpoint: string, onTranscript: (text: string) => void) {
  const [micState, setMicState] = useState<MicState>("idle");
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
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
          onTranscript(data.text.trim());
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
    setMicState("recording");
  }, [endpoint, onTranscript]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  // Discards any in-progress recording or in-flight transcription without
  // applying its result — for navigating away (next question, restart)
  // mid-recording, as opposed to the user intentionally finishing an answer.
  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setMicState("idle");
  }, []);

  const toggleMic = useCallback(() => {
    if (micState === "recording") stopRecording();
    else if (micState === "idle") startRecording();
  }, [micState, startRecording, stopRecording]);

  return { micState, error, toggleMic, cancelRecording };
}
