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

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: systemPrompt,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
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
