"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/lessons",
    label: "Lessons",
    icon: (
      <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    href: "/interview",
    label: "Interview",
    icon: (
      <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

type Props = {
  user: { name?: string | null; email?: string | null; plan?: string | null };
};

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const isFreePlan = !user.plan || user.plan === "FREE";

  return (
    <aside
      className="hidden md:flex flex-col shrink-0"
      style={{ width: 248, background: "#17130F", borderRight: "1px solid rgba(253,246,227,0.06)", position: "sticky", top: 0, height: "100vh" }}
    >
      {/* Logo */}
      <div style={{ padding: "28px 26px 22px", borderBottom: "1px solid rgba(253,246,227,0.06)" }}>
        <Link href="/" style={{ fontFamily: "'Newsreader', serif", fontSize: 23, fontWeight: 600, color: "#F5A623", textDecoration: "none" }}>
          Conceptra
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "22px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 11,
                fontSize: 15, fontWeight: 500, textDecoration: "none", transition: "all .15s",
                background: active ? "rgba(245,166,35,0.12)" : "transparent",
                color: active ? "#F5A623" : "#9C9286",
              }}
            >
              {icon}
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "18px 18px 22px", borderTop: "1px solid rgba(253,246,227,0.06)", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Plan badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
          <span style={{ fontSize: 12, color: "#8A8073" }}>Current plan</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", padding: "3px 9px", borderRadius: 999, background: isFreePlan ? "#2C2420" : "#F5A623", color: isFreePlan ? "#B3A799" : "#1C1917", border: isFreePlan ? "1px solid rgba(253,246,227,0.08)" : "none" }}>
            {user.plan ?? "FREE"}
          </span>
        </div>

        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 4px" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#F5A623", color: "#1C1917", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
            {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#FDF6E3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name ?? "User"}</p>
            <p style={{ fontSize: 12, color: "#8A8073", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 10, background: "none", border: "none", color: "#8A8073", fontSize: 14, cursor: "pointer", width: "100%", fontFamily: "inherit" }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
