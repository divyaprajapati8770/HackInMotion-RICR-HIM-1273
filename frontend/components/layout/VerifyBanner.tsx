"use client";

import { useState } from "react";
import { EnvelopeSimple, X } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";
import { resendVerification } from "@/lib/endpoints";

/**
 * Soft verification prompt shown to users whose email isn't confirmed yet.
 *
 * Deliberately a dismissible banner rather than a hard block on the
 * dashboard: gating the whole app behind an inbox round-trip is a real
 * failure mode during a live demo (flaky venue wifi, spam filters). The
 * account still works; this just nudges. If you'd rather enforce a hard
 * gate, the check lives in AuthService#login on the backend.
 */
export function VerifyBanner() {
  const { email, emailVerified } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (emailVerified || dismissed || !email) return null;

  async function handleResend() {
    if (!email) return;
    setSending(true);
    try {
      await resendVerification(email);
      setSent(true);
    } catch {
      setSent(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-alert/20 bg-alert/10 px-4 py-2.5 text-sm lg:px-8">
      <EnvelopeSimple size={16} className="shrink-0 text-alert" />
      <p className="flex-1 text-slate-700 dark:text-slate-200">
        {sent ? (
          <>Verification link sent to <span className="font-medium">{email}</span>.</>
        ) : (
          <>Confirm your email to secure your account.</>
        )}
      </p>
      {!sent && (
        <button
          onClick={handleResend}
          disabled={sending}
          title="Re-send the verification email"
          className="rounded-md px-2.5 py-1 text-xs font-semibold text-alert underline-offset-2 hover:underline disabled:opacity-50"
        >
          {sending ? "Sending…" : "Resend email"}
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        title="Dismiss"
        aria-label="Dismiss verification reminder"
        className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-500 hover:bg-black/5 dark:hover:bg-white/10"
      >
        <X size={14} />
      </button>
    </div>
  );
}
