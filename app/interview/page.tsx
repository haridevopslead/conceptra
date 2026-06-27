import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import InterviewSetup from "@/components/interview/setup";

export const metadata = { title: "Mock Interview — Conceptra" };

export default async function InterviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const plan = session.user.plan ?? "FREE";
  return <InterviewSetup plan={plan} />;
}
