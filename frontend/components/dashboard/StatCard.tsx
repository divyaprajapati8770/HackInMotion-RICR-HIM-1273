"use client";

import { useEffect, useRef } from "react";
import type { Icon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/Card";
import { cx } from "@/lib/format";

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: Icon;
  tone?: "indigo" | "emerald" | "amber" | "rose";
  hint?: string;
  /** Marks this as the focal card in a KPI row — adds the ambient hover glow. */
  hero?: boolean;
}

const toneClasses = {
  indigo: "bg-secondary/10 text-secondary",
  emerald: "bg-tertiary/10 text-tertiary",
  amber: "bg-alert/10 text-alert",
  rose: "bg-critical/10 text-critical",
};

const toneGlow = {
  indigo: "shadow-[0_0_0_0_rgb(79_70_229_/_0)] group-hover:shadow-[0_0_20px_2px_rgb(79_70_229_/_0.35)]",
  emerald: "shadow-[0_0_0_0_rgb(16_185_129_/_0)] group-hover:shadow-[0_0_20px_2px_rgb(16_185_129_/_0.35)]",
  amber: "shadow-[0_0_0_0_rgb(245_158_11_/_0)] group-hover:shadow-[0_0_20px_2px_rgb(245_158_11_/_0.35)]",
  rose: "shadow-[0_0_0_0_rgb(239_68_68_/_0)] group-hover:shadow-[0_0_20px_2px_rgb(239_68_68_/_0.35)]",
};

export function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  icon: IconComp,
  tone = "indigo",
  hint,
  hero,
}: StatCardProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const counter = useRef({ val: 0 });

  useEffect(() => {
    // gsap is loaded on demand (not bundled into the dashboard route's
    // main chunk) — the count-up is a nice-to-have polish animation, not
    // content, so it shouldn't cost first-paint/TTI budget for every visit.
    let tween: { kill: () => void } | undefined;
    let cancelled = false;

    import("gsap").then(({ default: gsap }) => {
      if (cancelled) return;
      tween = gsap.to(counter.current, {
        val: value,
        duration: 1.1,
        ease: "power2.out",
        onUpdate: () => {
          if (valueRef.current) {
            valueRef.current.textContent =
              prefix +
              counter.current.val.toLocaleString("en-IN", {
                maximumFractionDigits: decimals,
                minimumFractionDigits: decimals,
              }) +
              suffix;
          }
        },
      });
    });

    return () => {
      cancelled = true;
      tween?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Card glow={hero} tilt className="h-full">
      <div className="flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <div
            className={cx(
              "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-all duration-300 group-hover:scale-110",
              toneClasses[tone],
              toneGlow[tone]
            )}
          >
            <IconComp size={18} weight="bold" />
          </div>
        </div>

        <div className="mt-3">
          <span ref={valueRef} className="block font-display text-[26px] font-bold leading-none tabular text-ink">
            {prefix}0{suffix}
          </span>
          {/* Rendered unconditionally with a reserved min-height so cards
              with and without a hint settle to the same height in an
              items-stretch row. */}
          <p className="mt-2 min-h-[1rem] text-xs text-slate-400 dark:text-slate-500">{hint}</p>
        </div>
      </div>
    </Card>
  );
}
