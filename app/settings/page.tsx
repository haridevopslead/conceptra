import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import SettingsClient from "@/components/settings/settings-client";

export const metadata = { title: "Settings — Conceptra" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;

  let freshPlan = user.plan ?? "FREE";
  try {
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { plan: true } });
    if (dbUser) freshPlan = dbUser.plan ?? "FREE";
  } catch {
    // fall back to JWT plan
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 32px 80px" }}>
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8073", fontWeight: 600, marginBottom: 8 }}>
          Account
        </p>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "#FDF6E3", letterSpacing: "-0.01em" }}>
          Account Settings
        </h1>
      </div>

      <SettingsClient
        initialName={user.name ?? ""}
        email={user.email ?? ""}
        plan={freshPlan}
      />
    </div>
  );
}
