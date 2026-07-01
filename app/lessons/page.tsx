import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import LessonsClient from "@/components/lessons/lessons-client";

export const metadata = {
  title: "Interview Prep Briefs — Conceptra",
};

export default async function LessonsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  let plan = session.user.plan ?? "FREE";

  let visitedSlugs: string[] = [];
  let lessons: Awaited<ReturnType<typeof db.lesson.findMany>> = [];
  try {
    const [dbUser, progress, lessonRows] = await Promise.all([
      db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
      db.userLessonProgress.findMany({
        where: { userId: session.user.id },
        select: { lessonSlug: true },
      }),
      db.lesson.findMany({
        where: { published: true },
        orderBy: { order: "asc" },
      }),
    ]);
    if (dbUser) plan = dbUser.plan;
    visitedSlugs = progress.map((p) => p.lessonSlug);
    lessons = lessonRows;
  } catch {
    // DB unavailable — show lessons without progress markers
  }

  return <LessonsClient plan={plan} visitedSlugs={visitedSlugs} lessons={lessons} />;
}
