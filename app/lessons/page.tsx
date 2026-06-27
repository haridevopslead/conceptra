import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LessonsClient from "@/components/lessons/lessons-client";

export const metadata = {
  title: "Lessons — Conceptra",
};

export default async function LessonsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const plan = session.user.plan ?? "FREE";

  return <LessonsClient plan={plan} />;
}
