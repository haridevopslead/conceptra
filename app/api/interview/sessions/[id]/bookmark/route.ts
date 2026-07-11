import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const { bookmarked } = await req.json();
  if (typeof bookmarked !== "boolean") {
    return NextResponse.json({ ok: false, error: "Missing bookmarked boolean" }, { status: 400 });
  }

  try {
    // Scoped by userId in the same query so a user can never bookmark/unbookmark
    // another user's session — no separate ownership check needed.
    const { count } = await db.interviewSession.updateMany({
      where: { id: params.id, userId: session.user.id },
      data: { bookmarked },
    });
    if (count === 0) return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.json({ ok: true, bookmarked });
  } catch {
    return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });
  }
}
