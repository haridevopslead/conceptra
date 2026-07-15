"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OAuthButtons, type OAuthProviderId } from "@/components/auth/oauth-buttons";

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterForm({ enabledProviders }: { enabledProviders: OAuthProviderId[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Auto sign-in after successful registration
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 600, color: "var(--accent-text)", textDecoration: "none" }}>
            Conceptra
          </Link>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 30, fontWeight: 500, color: "var(--foreground)", marginTop: 16 }}>Create your account</h1>
          <p style={{ color: "var(--muted)", marginTop: 8, fontSize: 15 }}>
            Start mastering DevOps interviews today
          </p>
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
              <span style={{ color: "var(--muted)", fontSize: 12 }}>or sign up with email</span>
              <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: "var(--muted)" }}>
                Full Name
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={field("name")}
                placeholder="John Smith"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: "var(--muted)" }}>
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={field("email")}
                placeholder="you@example.com"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: "var(--muted)" }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={field("password")}
                placeholder="Min. 8 characters"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: "var(--muted)" }}>
                Confirm Password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={field("confirmPassword")}
                placeholder="Repeat your password"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-sm transition-opacity disabled:opacity-60 hover:opacity-90"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>

            <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
              By signing up you agree to our Terms and Privacy Policy.
            </p>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold hover:underline"
            style={{ color: "var(--accent-text)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
