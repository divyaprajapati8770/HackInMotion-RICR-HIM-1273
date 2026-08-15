"use client";

import Link from "next/link";
import { Stack } from "@phosphor-icons/react";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-100 bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white dark:bg-transparent">
              <Image height={40} width={40} src={"/images/logo.png"} alt="logo" />
            </div>
            <span className="font-display text-base font-bold text-ink">Obstocker</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <Link href="/login" title="Log in" className="hover:text-ink transition-colors">Log in</Link>
            <Link href="/signup" title="Sign up" className="hover:text-ink transition-colors">Sign up</Link>
          </nav>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400 sm:text-left">
          An inventory & demand forecasting system.
        </p>
      </div>
    </footer>
  );
}
