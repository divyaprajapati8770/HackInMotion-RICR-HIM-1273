"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { Button } from "@/components/ui/Button";
import { EmailVerifiedIllustration, ErrorIllustration } from "@/components/illustrations/Illustrations";
import { verifyEmail } from "@/lib/endpoints";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

const REDIRECT_DELAY_MS = 1600;

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const markVerified = useAuthStore((s) => s.markVerified);
  const hasSession = useAuthStore((s) => Boolean(s.token));
  const [state, setState] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This link is missing its verification token.");
      return;
    }
    verifyEmail(token)
      .then(() => {
        // Reflects the verified state immediately if this browser already
        // holds the session from signup (the common case: same browser,
        // link opened from a new tab or the mail client's in-app browser).
        // If there's no session here — the link was opened on a different
        // device — this is a no-op and the redirect below simply lands on
        // /login via middleware, which is the correct fallback.
        markVerified();
        setState("ok");
      })
      .catch((err) => {
        setState("error");
        setMessage(apiErrorMessage(err, "We couldn't verify this link."));
      });
  }, [token, markVerified]);

  useEffect(() => {
    if (state !== "ok") return;
    const t = setTimeout(() => router.push("/dashboard"), REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, [state, router]);

  return (
    <div className="w-full max-w-sm text-center">
      {state === "working" && (
        <>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Verifying your email…</p>
        </>
      )}

      {state === "ok" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <EmailVerifiedIllustration className="max-w-[220px]" />
          <h1 className="mt-2 font-display text-xl font-bold text-ink">Email verified</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {hasSession
              ? "Your Obstocker account is fully set up. Taking you to your dashboard…"
              : "Your Obstocker account is fully set up. Log in to continue."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
            Redirecting…
          </div>
          <Link href={hasSession ? "/dashboard" : "/login"}>
            <Button className="mt-4 w-full">{hasSession ? "Go now" : "Go to login"}</Button>
          </Link>
        </motion.div>
      )}

      {state === "error" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <ErrorIllustration className="max-w-[200px]" />
          <h1 className="mt-2 font-display text-xl font-bold text-ink">Verification failed</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{message}</p>
          <Link href={hasSession ? "/dashboard" : "/signup"}>
            <Button variant="secondary" className="mt-6 w-full">
              {hasSession ? "Continue to dashboard" : "Back to sign up"}
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-6">
      <div className="flex flex-col items-center gap-10">
        <BrandHeader size="lg" />
        {/* useSearchParams needs a Suspense boundary to stay statically
            prerenderable — without it the whole route is forced dynamic. */}
        <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />}>
          <VerifyInner />
        </Suspense>
      </div>
    </main>
  );
}
