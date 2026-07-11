import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, TranscriptionError } from "@/lib/interview/transcribe";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Transcription is cheap (~$0.0007/min at Groq's rate), so this is mainly an
// abuse guard rather than a strict cost control — separate bucket from
// /api/try/evaluate's limit so a few re-recordings don't eat into that quota.
const DAILY_LIMIT = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("audio");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  const ip = getClientIp(req.headers);
  const { allowed } = checkRateLimit(`try-transcribe:${ip}`, DAILY_LIMIT, WINDOW_MS);
  if (!allowed) {
    return NextResponse.json(
      { error: "You've used all your free voice transcriptions for today." },
      { status: 429 }
    );
  }

  try {
    const text = await transcribeAudio(file);
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof TranscriptionError ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
