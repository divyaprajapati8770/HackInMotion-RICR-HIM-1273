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
import { signup } from "@/lib/endpoints";
import { useAuthStore } from "@/lib/auth-store";
import { apiErrorMessage } from "@/lib/api-client";

const AnimatedStockPanel = dynamic(
  () => import("@/components/auth/AnimatedStockPanel").then((m) => m.AnimatedStockPanel),
  { ssr: false, loading: () => <div className="hidden lg:block bg-brand-primary" /> }
);

export default function SignupPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await signup({ businessName, email, password });
      setSession(res);
      router.push("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create your account. Please try again."));
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

          <h2 className="font-display text-2xl font-semibold text-ink">Create your account</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            We&apos;ll seed a demo catalog and 6 months of sales history so your dashboard isn&apos;t empty on day one.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Business name"
              id="businessName"
              placeholder="Aurora Retail Co."
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3.5 py-2.5 text-xs text-rose-600">
                <Warning size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
