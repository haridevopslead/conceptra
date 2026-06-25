"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
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
      style={{ backgroundColor: "#0A0E1A" }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ color: "#F5A623" }}>
            Conceptra
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4">Create your account</h1>
          <p className="text-gray-400 mt-2">
            Start mastering DevOps interviews today
          </p>
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
              Full Name
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={field("name")}
              placeholder="John Smith"
              className="w-full rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
              style={{ backgroundColor: "#1F2937" }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={field("email")}
              placeholder="you@example.com"
              className="w-full rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
              style={{ backgroundColor: "#1F2937" }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
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
              className="w-full rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
              style={{ backgroundColor: "#1F2937" }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={field("confirmPassword")}
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
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <p className="text-xs text-center text-gray-500">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-300">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-gray-300">
              Privacy Policy
            </Link>
            .
          </p>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold hover:underline"
            style={{ color: "#F5A623" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
