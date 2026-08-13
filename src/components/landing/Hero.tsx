"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "@phosphor-icons/react";

// Three.js + @react-three/fiber are loaded on demand and never rendered
// server-side — a WebGL canvas has no meaningful SSR output and pulling
// the whole three.js runtime into the landing page's initial bundle would
// directly contradict the "keep TTFB/initial load fast" requirement this
// page exists to satisfy. The gradient fallback below fills the same
// space with zero JS while the real scene streams in.
const HeroScene = dynamic(() => import("@/components/landing/HeroScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-indigo-900 to-brand-primary" />
  ),
});

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-brand-primary text-white">
      <HeroScene />

      {/* Readability scrim so text stays legible over the 3D field regardless of where cubes drift */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-primary/40 to-brand-primary/10" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          AI-powered demand forecasting for retail & e-commerce
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          Never run out.
          <br />
          <span className="bg-gradient-to-r from-indigo-300 via-white to-emerald-300 bg-clip-text text-transparent">
            Never overstock.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70"
        >
          Stockwise turns your sales history into a clear demand forecast for every SKU —
          so restocking is a decision you make in seconds, not a guess you make in a spreadsheet.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/signup"
            className="group flex items-center gap-2 rounded-full bg-indigo-500 px-7 py-3.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Start forecasting free
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#simulator"
            className="flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Play size={16} weight="fill" />
            See it work
          </a>
        </motion.div>
      </div>
    </section>
  );
}
