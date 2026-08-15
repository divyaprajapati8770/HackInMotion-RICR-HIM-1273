"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cx } from "@/lib/format";

/**
 * Shared illustration set for empty/error/terminal states, styled to match
 * the app's own subject matter (boxes, shelves, stock charts) rather than
 * generic stock art. All are inline SVG so they inherit brand colors via
 * currentColor/CSS vars and stay crisp + theme-aware without an image
 * request. Each gets a soft ambient blob behind it (same recipe as
 * .glow-card-hover in globals.css) plus a slow floating drift — restrained,
 * not distracting, since these sit on pages the user may stare at a while
 * (404s, error boundaries).
 */
function IllustrationFrame({
  children,
  glow = "indigo",
  className,
}: {
  children: ReactNode;
  glow?: "indigo" | "emerald" | "amber" | "rose";
  className?: string;
}) {
  const glowColor = {
    indigo: "rgb(var(--color-secondary) / 0.16)",
    emerald: "rgb(var(--color-tertiary) / 0.16)",
    amber: "rgb(var(--color-alert) / 0.18)",
    rose: "rgb(var(--color-critical) / 0.16)",
  }[glow];

  return (
    <div className={cx("relative mx-auto w-full max-w-[280px]", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 blur-3xl"
        style={{ background: `radial-gradient(circle at 50% 45%, ${glowColor}, transparent 70%)` }}
      />
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Open, empty box with a "?" — for empty lists/filters (inventory, forecasts with no data). */
export function EmptyBoxIllustration({ className }: { className?: string }) {
  return (
    <IllustrationFrame glow="indigo" className={className}>
      <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <ellipse cx="140" cy="188" rx="82" ry="10" className="fill-slate-900/5 dark:fill-black/30" />
        {/* Box back flaps */}
        <path d="M62 108L140 84L218 108L140 132Z" className="fill-indigo-100 dark:fill-indigo-500/15" />
        <path d="M62 108V150L140 174V132Z" className="fill-indigo-50 dark:fill-white/[0.03]" stroke="currentColor" strokeOpacity="0.12" />
        <path d="M218 108V150L140 174V132Z" className="fill-indigo-100/70 dark:fill-white/[0.06]" stroke="currentColor" strokeOpacity="0.12" />
        {/* open flaps */}
        <path d="M74 104L120 70L140 84L92 118Z" className="fill-secondary/25" />
        <path d="M206 104L160 70L140 84L188 118Z" className="fill-secondary/15" />
        {/* Question mark */}
        <text x="140" y="70" textAnchor="middle" className="fill-secondary font-display" fontSize="34" fontWeight="700">
          ?
        </text>
        {/* Box seam lines */}
        <path d="M140 132V174" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1.5" />
      </svg>
    </IllustrationFrame>
  );
}

/** Checkmark badge over a stack of boxes — for "all resolved / all clear" states. */
export function AllClearIllustration({ className }: { className?: string }) {
  return (
    <IllustrationFrame glow="emerald" className={className}>
      <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <ellipse cx="140" cy="188" rx="78" ry="10" className="fill-slate-900/5 dark:fill-black/30" />
        <rect x="70" y="120" width="60" height="52" rx="6" className="fill-emerald-100 dark:fill-emerald-500/10" />
        <rect x="70" y="120" width="60" height="14" rx="6" className="fill-tertiary/30" />
        <rect x="150" y="100" width="66" height="72" rx="6" className="fill-emerald-50 dark:fill-white/[0.04]" stroke="currentColor" strokeOpacity="0.1" />
        <rect x="150" y="100" width="66" height="16" rx="6" className="fill-tertiary/25" />
        <circle cx="140" cy="82" r="34" className="fill-tertiary" />
        <path d="M124 82L136 94L158 68" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </IllustrationFrame>
  );
}

/** Person peering into an oversized open box with a "?" hovering above — 404 page. */
export function NotFoundIllustration({ className }: { className?: string }) {
  return (
    <IllustrationFrame glow="indigo" className={className}>
      <svg viewBox="0 0 320 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <ellipse cx="160" cy="228" rx="110" ry="12" className="fill-slate-900/5 dark:fill-black/30" />

        {/* big open box */}
        <path d="M60 150L160 116L260 150L160 184Z" className="fill-indigo-100 dark:fill-indigo-500/15" />
        <path d="M60 150V206L160 240V184Z" className="fill-indigo-50 dark:fill-white/[0.03]" stroke="currentColor" strokeOpacity="0.12" />
        <path d="M260 150V206L160 240V184Z" className="fill-indigo-100/70 dark:fill-white/[0.06]" stroke="currentColor" strokeOpacity="0.12" />
        <path d="M78 146L130 104L160 116L104 162Z" className="fill-secondary/20" />
        <path d="M242 146L190 104L160 116L216 162Z" className="fill-secondary/12" />

        {/* floating 404 */}
        <text x="160" y="70" textAnchor="middle" className="fill-secondary font-display" fontSize="40" fontWeight="900" letterSpacing="2">
          404
        </text>

        {/* person */}
        <g transform="translate(96 128)">
          <circle cx="30" cy="10" r="12" className="fill-primary dark:fill-slate-200" />
          <path d="M10 70C10 50 18 34 30 34C42 34 50 50 50 70" className="fill-primary dark:fill-slate-200" />
          <rect x="4" y="66" width="52" height="10" rx="5" className="fill-primary dark:fill-slate-200" />
        </g>
      </svg>
    </IllustrationFrame>
  );
}

/** Cracked/tilted stat card with a warning glyph — generic error boundary. */
export function ErrorIllustration({ className }: { className?: string }) {
  return (
    <IllustrationFrame glow="rose" className={className}>
      <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <ellipse cx="140" cy="188" rx="78" ry="10" className="fill-slate-900/5 dark:fill-black/30" />
        <g transform="rotate(-6 140 120)">
          <rect x="72" y="70" width="136" height="96" rx="12" className="fill-rose-50 dark:fill-white/[0.04]" stroke="currentColor" strokeOpacity="0.1" />
          <path d="M88 140L112 108L132 128L156 92L192 140" stroke="currentColor" strokeOpacity="0.18" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <circle cx="140" cy="70" r="30" className="fill-critical" />
        <rect x="137" y="56" width="6" height="18" rx="3" fill="white" />
        <circle cx="140" cy="82" r="3.5" fill="white" />
      </svg>
    </IllustrationFrame>
  );
}
