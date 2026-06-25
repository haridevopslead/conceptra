"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
      style={{ backgroundColor: "#0A0E1A" }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ color: "#F5A623" }}>
            Conceptra
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4">Welcome back</h1>
          <p className="text-gray-400 mt-2">Sign in to continue your journey</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 p-8 space-y-5"
          style={{ backgroundColor: "#111827" }}
        >
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
              style={{ backgroundColor: "#1F2937" }}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs hover:underline"
                style={{ color: "#F5A623" }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
              style={{ backgroundColor: "#1F2937" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-sm transition-opacity disabled:opacity-60 hover:opacity-90"
            style={{ backgroundColor: "#F5A623", color: "#0A0E1A" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold hover:underline"
            style={{ color: "#F5A623" }}
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
