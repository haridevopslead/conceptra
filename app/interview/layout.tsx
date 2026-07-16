import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/dashboard/sidebar";
import BottomNav from "@/components/dashboard/bottom-nav";

export default async function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-dvh" style={{ backgroundColor: "var(--background)" }}>
      <Sidebar user={session.user} />
      <main className="flex-1 h-full min-h-0 overflow-auto pb-20 md:pb-0 w-full max-w-5xl mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
