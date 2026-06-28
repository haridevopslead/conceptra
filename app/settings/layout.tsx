import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/dashboard/sidebar";
import BottomNav from "@/components/dashboard/bottom-nav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#1C1917" }}>
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
