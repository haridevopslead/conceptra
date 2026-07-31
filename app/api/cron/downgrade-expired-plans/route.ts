import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Runs daily via Vercel Cron (see vercel.json). Access is already enforced
// live everywhere plan is checked (lib/plan.ts treats a lapsed
// planExpiresAt as FREE regardless of the stored column), so this job isn't
// what keeps Pro-gated features locked down — it exists so the stored
// `plan` column and any UI badge reading it directly stay accurate instead
// of silently lying "PRO" forever. Never touches HariWeakArea, session
// logs, etc. — downgrading only ever changes the `plan` column.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db.user.updateMany({
    where: { plan: "PRO", planExpiresAt: { lt: new Date() } },
    data: { plan: "FREE" },
  });

  return NextResponse.json({ downgraded: result.count });
}
