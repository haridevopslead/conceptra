export class TranscriptionError extends Error {}

// Groq's free-tier cap. A spoken interview answer should be nowhere near
// this, but guard against a runaway recording anyway.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export type TranscriptionResult = { text: string; durationSeconds: number };

// Single source of truth for calling Groq's Whisper transcription endpoint.
// Used by both the authenticated practice flow and the public /try flow.
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  if (audioBlob.size === 0) {
    throw new TranscriptionError("No audio was recorded.");
  }
  if (audioBlob.size > MAX_FILE_SIZE_BYTES) {
    throw new TranscriptionError("Recording is too long — please keep answers to a few minutes.");
  }

  const ext = audioBlob.type.includes("mp4") ? "mp4" : audioBlob.type.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append("file", audioBlob, `answer.${ext}`);
  form.append("model", "whisper-large-v3-turbo");
  form.append("language", "en");
  // verbose_json (Groq's OpenAI-compatible response format) adds a top-level
  // "duration" field with the actual processed audio length in seconds —
  // used to log real AI cost instead of estimating from blob size.
  form.append("response_format", "verbose_json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    throw new TranscriptionError(`Transcription request failed (${res.status})`);
  }

  const data = await res.json();
  if (typeof data.text !== "string") {
    throw new TranscriptionError("Malformed transcription response");
  }

  return {
    text: data.text,
    durationSeconds: typeof data.duration === "number" ? data.duration : 0,
  };
}
