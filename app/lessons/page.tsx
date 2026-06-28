import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import LessonsClient from "@/components/lessons/lessons-client";

export const metadata = {
  title: "Lessons — Conceptra",
};

export default async function LessonsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const plan = session.user.plan ?? "FREE";

  let visitedSlugs: string[] = [];
  try {
    const progress = await db.userLessonProgress.findMany({
      where: { userId: session.user.id },
      select: { lessonSlug: true },
    });
    visitedSlugs = progress.map((p) => p.lessonSlug);
  } catch {
    // DB unavailable — show lessons without progress markers
  }

  return <LessonsClient plan={plan} visitedSlugs={visitedSlugs} />;
}
