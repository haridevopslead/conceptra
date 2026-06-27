import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Evaluator from "@/components/interview/evaluator";

export const metadata = { title: "Mock Interview — Conceptra" };

export default async function InterviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <Evaluator />;
}
