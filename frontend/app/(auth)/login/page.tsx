"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Warning } from "@phosphor-icons/react";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { login } from "@/lib/endpoints";
import { useAuthStore } from "@/lib/auth-store";
import { apiErrorMessage } from "@/lib/api-client";

// Deferred: the hero panel is decorative (hidden on mobile) and pulls in
// gsap for its bar animation. Loading it after the initial paint keeps the
// actual login form — the part people came here to use — off the critical
// path of a heavier, non-essential dependency.
const AnimatedStockPanel = dynamic(
  () => import("@/components/auth/AnimatedStockPanel").then((m) => m.AnimatedStockPanel),
  { ssr: false, loading: () => <div className="hidden lg:block bg-brand-primary" /> }
);

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ email, password });
      setSession(res);
      router.push("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not log in. Check your email and password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-canvas">
      <AnimatedStockPanel />

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <BrandHeader />
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Log in to your inventory dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Email"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@business.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-300">
                <Warning size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Log in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
