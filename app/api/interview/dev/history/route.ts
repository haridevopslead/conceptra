import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEffectivePlan } from "@/lib/plan";

// Backs the FREE-plan upgrade nudge on the Interview with Hari setup screen:
// "you've done this topic before" without exposing the PRO no-repeat memory
// itself. PRO/ENTERPRISE always get hasPriorSession: false since they don't
// need the nudge — the route.ts prompt already handles their memory.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const topic = req.nextUrl.searchParams.get("topic");
  if (!topic) return new Response("Missing topic", { status: 400 });

  const { plan } = await getEffectivePlan(session.user.id);

  let hasPriorSession = false;
  if (plan === "FREE") {
    const priorLog = await db.hariSessionLog.findFirst({
      where: { userId: session.user.id, topic },
      select: { id: true },
    });
    hasPriorSession = Boolean(priorLog);
  }

  return Response.json({ plan, hasPriorSession });
}
