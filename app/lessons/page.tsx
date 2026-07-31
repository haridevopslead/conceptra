import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectivePlan } from "@/lib/plan";
import LessonsClient from "@/components/lessons/lessons-client";

export const metadata = {
  title: "Interview Prep Briefs — Conceptra",
};

export default async function LessonsPage() {
  const session = await getServerSession(authOptions);
  let plan = session?.user?.plan ?? "FREE";

  let visitedSlugs: string[] = [];
  let lessons: Awaited<ReturnType<typeof db.lesson.findMany>> = [];
  try {
    lessons = await db.lesson.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
    });

    // Progress/plan only apply to a signed-in visitor — an anonymous
    // visitor sees the same full topic list, just without those extras.
    if (session?.user?.id) {
      const [dbUser, progress] = await Promise.all([
        db.user.findUnique({ where: { id: session.user.id }, select: { plan: true, planExpiresAt: true } }),
        db.userLessonProgress.findMany({
          where: { userId: session.user.id },
          select: { lessonSlug: true },
        }),
      ]);
      if (dbUser) plan = effectivePlan(dbUser.plan, dbUser.planExpiresAt);
      visitedSlugs = progress.map((p) => p.lessonSlug);
    }
  } catch {
    // DB unavailable — show lessons without progress markers
  }

  return (
    <LessonsClient
      plan={plan}
      visitedSlugs={visitedSlugs}
      lessons={lessons}
      anonymous={!session}
    />
  );
}
