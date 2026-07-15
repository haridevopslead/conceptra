"use client";

import { signIn } from "next-auth/react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.089-.744.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.62-5.48 5.92.43.372.815 1.102.815 2.222 0 1.604-.015 2.898-.015 3.293 0 .32.216.694.825.576C20.565 21.796 24 17.298 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#0A66C2"/>
      <path fill="#fff" d="M7.12 9.4H4.2V19.4h2.92V9.4ZM5.66 8.14a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM19.8 13.66c0-2.87-1.53-4.2-3.58-4.2-1.65 0-2.39.91-2.8 1.55V9.4H10.5c.04.83 0 10 0 10h2.92v-5.58c0-.3.02-.6.11-.81.24-.6.79-1.23 1.71-1.23 1.2 0 1.68.92 1.68 2.26v5.36h2.92l-.04-5.74Z"/>
    </svg>
  );
}

export type OAuthProviderId = "google" | "github" | "linkedin";

const OAUTH_PROVIDERS = [
  { id: "google", label: "Continue with Google", icon: GoogleIcon },
  { id: "github", label: "Continue with GitHub", icon: GitHubIcon },
  { id: "linkedin", label: "Continue with LinkedIn", icon: LinkedInIcon },
] as const;

export function OAuthButtons({
  providers,
  callbackUrl = "/dashboard",
}: {
  providers: OAuthProviderId[];
  callbackUrl?: string;
}) {
  const active = OAUTH_PROVIDERS.filter((p) => providers.includes(p.id));
  if (active.length === 0) return null;

  return (
    <div className="space-y-3">
      {active.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => signIn(id, { callbackUrl })}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        >
          <Icon />
          {label}
        </button>
      ))}
    </div>
  );
}
