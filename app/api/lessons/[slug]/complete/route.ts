import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    await db.userLessonProgress.upsert({
      where: { userId_lessonSlug: { userId: session.user.id, lessonSlug: params.slug } },
      update: { completed: true, completedAt: new Date() },
      create: { userId: session.user.id, lessonSlug: params.slug, completed: true, completedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });
  }
}
