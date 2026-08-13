"use client";

import Link from "next/link";
import { Stack } from "@phosphor-icons/react";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-100 bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500 text-white">
              <Stack size={18} weight="fill" />
            </div>
            <span className="font-display text-base font-bold text-ink">Stockwise</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <Link href="/login" title="Log in" className="hover:text-ink transition-colors">Log in</Link>
            <Link href="/signup" title="Sign up" className="hover:text-ink transition-colors">Sign up</Link>
            <Link href="/contact" title="Contact us" className="hover:text-ink transition-colors">Contact</Link>
          </nav>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400 sm:text-left">
          AI-Powered Inventory & Demand Forecasting System — built for HackInMotion.
        </p>
      </div>
    </footer>
  );
}
