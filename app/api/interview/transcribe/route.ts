import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transcribeAudio, TranscriptionError } from "@/lib/interview/transcribe";
import { logTranscribeCost } from "@/lib/ai-cost";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("audio");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  try {
    const { text, durationSeconds } = await transcribeAudio(file);
    logTranscribeCost({ userId: session.user.id, audioSeconds: durationSeconds });
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof TranscriptionError ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
