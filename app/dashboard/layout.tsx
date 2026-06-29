import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Sidebar from "@/components/dashboard/sidebar";
import BottomNav from "@/components/dashboard/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Fetch plan fresh from DB so the sidebar reflects upgrades immediately
  let freshPlan = session.user.plan;
  try {
    const dbUser = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
    if (dbUser) freshPlan = dbUser.plan;
  } catch {
    // fall back to JWT plan
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#1C1917" }}>
      <Sidebar user={{ ...session.user, plan: freshPlan }} />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
