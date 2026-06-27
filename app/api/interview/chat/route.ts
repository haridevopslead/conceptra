import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { anthropic } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { messages, topic, level } = await req.json();

  const systemPrompt = `You are a senior DevOps interviewer at a top technology company conducting a realistic mock technical interview.

Topic: ${topic}
Candidate level: ${level}

QUESTION mode — when the user asks for a question:
Ask one focused, realistic technical question appropriate for this level. 2–3 sentences max. No hints. No multi-part questions.

EVALUATE mode — when the user's message starts with "EVALUATE:":
Respond in exactly this format (no deviations):
Score: X/10
Strengths: <1–2 sentences on what they got right, with specific technical terms>
Improve: <2–3 sentences on concrete gaps — name the specific tools, flags, concepts, or commands they should have mentioned>

Keep the entire evaluation under 100 words. Be direct and honest.`;

  const msgStream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: systemPrompt,
    messages,
  });

  const encoder = new TextEncoder();

  // Use the SDK's event-emitter API instead of async iteration.
  // This avoids potential race conditions where error/end events fire
  // before the async iterator's listeners are registered, causing hangs.
  const readable = new ReadableStream({
    start(controller) {
      msgStream.on("text", (text) => {
        controller.enqueue(encoder.encode(text));
      });
      msgStream.on("end", () => {
        controller.close();
      });
      msgStream.on("error", (err) => {
        controller.error(err);
      });
      msgStream.on("abort", (err) => {
        controller.error(err);
      });
    },
    cancel() {
      msgStream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
