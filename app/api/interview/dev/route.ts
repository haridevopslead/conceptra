import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { anthropic } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { messages, topic, difficulty } = await req.json();

  const systemPrompt = `You are Dev, a Senior DevOps Mentor conducting a real job interview.
Be direct, warm, and honest. Ask ONE question at a time.
Follow up naturally based on the candidate's answer.
After 5-6 exchanges, say "Let me give you my honest feedback." then write:
SCORE: X/10
STRONG: what they did well
IMPROVE: what needs work
SENIOR_ANSWER: how a senior engineer would answer

Topic: ${topic} | Difficulty: ${difficulty}`;

  const msgStream = anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const encoder = new TextEncoder();

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
