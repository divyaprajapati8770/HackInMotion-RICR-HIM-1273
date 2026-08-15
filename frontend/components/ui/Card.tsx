"use client";

import { cx } from "@/lib/format";
import { useTilt } from "@/lib/useTilt";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  tilt?: boolean;
}

export function Card({ className, glow, tilt, ...props }: CardProps) {
  const { ref, onMouseMove, onMouseLeave } = useTilt<HTMLDivElement>();

  const tiltHandlers = tilt
    ? { ref, onMouseMove, onMouseLeave }
    : {};

  return (
    <div
      className={cx(
        "rounded-xl2 border border-slate-100 bg-surface shadow-card transition-all duration-300",
        tilt && "tilt-card tilt-spotlight",
        glow && "glow-card-hover",
        className
      )}
      {...tiltHandlers}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("flex items-start justify-between gap-3 p-5 pb-3", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("p-5 pt-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cx("font-display text-[15px] font-semibold text-ink", className)} {...props} />;
}
