"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { TrendUp } from "@phosphor-icons/react";
import { BrandHeader } from "@/components/layout/BrandHeader";

const BAR_COUNT = 24;

/**
 * The hero for the auth screens: a live-looking bank of shelf/stock bars
 * that continuously reflow, standing in for the product's core promise —
 * turning noisy daily sales into a legible, moving picture of demand.
 */
export function AnimatedStockPanel() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bars = containerRef.current?.querySelectorAll<HTMLDivElement>("[data-bar]");
    if (!bars || bars.length === 0) return;

    const tweens: gsap.core.Tween[] = [];
    bars.forEach((bar, i) => {
      const animate = () => {
        const height = 18 + Math.random() * 82;
        const tween = gsap.to(bar, {
          height: `${height}%`,
          duration: 1.6 + Math.random() * 1.2,
          ease: "sine.inOut",
          delay: i * 0.03,
          onComplete: animate,
        });
        tweens.push(tween);
      };
      animate();
    });

    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, []);

  return (
    // bg-brand-primary (not bg-ink) deliberately: `ink` now flips with the
    // site theme (see globals.css), but this hero panel is always a fixed
    // dark surface regardless of light/dark mode, same as the brand mark.
    <div className="relative hidden lg:flex flex-col justify-between h-full w-full overflow-hidden bg-brand-primary px-12 py-12 text-white">
      <div className="relative z-10">
        <BrandHeader size="lg" light />
      </div>

      <div className="relative z-10 max-w-sm">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <TrendUp size={14} weight="bold" />
          AI-powered demand forecasting
        </div>
        <h1 className="font-display text-3xl font-semibold leading-tight text-white">
          Never run out.
          <br />
          Never overstock.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Obstocker turns your sales history into a clear forecast for every SKU —
          so restocking is a decision you make in seconds, not a guess you make in a spreadsheet.
        </p>
      </div>

      <div ref={containerRef} className="relative z-10 flex items-end gap-1.5 h-40">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            data-bar
            className="flex-1 rounded-t-sm bg-gradient-to-t from-indigo-500 to-indigo-300"
            style={{ height: "20%" }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
    </div>
  );
}
