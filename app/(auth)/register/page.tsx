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
      style={{ backgroundColor: "#1C1917" }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 600, color: "#F5A623", textDecoration: "none" }}>
            Conceptra
          </Link>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 30, fontWeight: 500, color: "#FDF6E3", marginTop: 16 }}>Create your account</h1>
          <p style={{ color: "#8A8073", marginTop: 8, fontSize: 15 }}>
            Start mastering DevOps interviews today
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 p-8 space-y-5"
          style={{ backgroundColor: "#2C2420" }}
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
              style={{ backgroundColor: "#211C18" }}
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
              style={{ backgroundColor: "#211C18" }}
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
              style={{ backgroundColor: "#211C18" }}
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
              placeholder="Repeat your password"
              className="w-full rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
              style={{ backgroundColor: "#211C18" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-sm transition-opacity disabled:opacity-60 hover:opacity-90"
            style={{ backgroundColor: "#F5A623", color: "#1C1917" }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <p className="text-xs text-center" style={{ color: "#6E665C" }}>
            By signing up you agree to our Terms and Privacy Policy.
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
