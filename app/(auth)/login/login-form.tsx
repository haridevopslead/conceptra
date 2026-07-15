"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OAuthButtons, type OAuthProviderId } from "@/components/auth/oauth-buttons";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "An account already exists with this email using a different sign-in method. Sign in with your email and password instead.",
  OAuthEmailNotVerified:
    "We couldn't confirm a verified email address from that provider. Please try a different sign-in method.",
  AccessDenied: "Access was denied. Please try again or use a different sign-in method.",
  OAuthSignin: "Something went wrong starting that sign-in. Please try again.",
  OAuthCallback: "Something went wrong signing in with that provider. Please try again.",
  Callback: "Something went wrong signing in with that provider. Please try again.",
};

function LoginForm({ enabledProviders }: { enabledProviders: OAuthProviderId[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    oauthError ? OAUTH_ERROR_MESSAGES[oauthError] ?? "Something went wrong. Please try again." : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 600, color: "var(--accent-text)", textDecoration: "none" }}>
            Conceptra
          </Link>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 30, fontWeight: 500, color: "var(--foreground)", marginTop: 16 }}>Welcome back</h1>
          <p style={{ color: "var(--muted)", marginTop: 8, fontSize: 15 }}>Sign in to continue your journey</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8 space-y-5"
          style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20">
              {error}
            </div>
          )}

          <OAuthButtons providers={enabledProviders} callbackUrl="/dashboard" />

          {enabledProviders.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
              <span style={{ color: "var(--muted)", fontSize: 12 }}>or continue with email</span>
              <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: "var(--muted)" }}>
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium" style={{ color: "var(--muted)" }}>
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-sm transition-opacity disabled:opacity-60 hover:opacity-90"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold hover:underline"
            style={{ color: "var(--accent-text)" }}
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginFormWithSuspense({ enabledProviders }: { enabledProviders: OAuthProviderId[] }) {
  return (
    <Suspense>
      <LoginForm enabledProviders={enabledProviders} />
    </Suspense>
  );
}
