"use client";

import { motion } from "framer-motion";
import type { StockStatus } from "@/lib/types";
import { stockStatusTokens } from "@/lib/format";

interface StockPulseProps {
  percent: number;
  status: StockStatus;
  reorderMarkerPercent?: number; // position of the reorder point on the bar, 0-100
  size?: "sm" | "md";
}

/**
 * The project's signature visual element: a horizontal fill bar showing
 * current stock level, color-coded by status, with a marker tick for the
 * reorder point. Reused on product cards, the inventory table, and the
 * alert feed so the same "read the shelf at a glance" language appears
 * everywhere in the app.
 */
export function StockPulse({ percent, status, reorderMarkerPercent, size = "md" }: StockPulseProps) {
  const tokens = stockStatusTokens[status];
  const height = size === "sm" ? "h-1.5" : "h-2.5";
  const clamped = Math.max(2, Math.min(100, percent));

  return (
    <div className="w-full">
      <div className={`relative w-full ${height} rounded-full bg-slate-100 overflow-visible`}>
        <motion.div
          className={`${height} rounded-full ${tokens.bar} ${status === "CRITICAL" ? "animate-pulse-bar" : ""}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        {typeof reorderMarkerPercent === "number" && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[calc(100%+6px)] bg-ink/30 rounded-full"
            style={{ left: `${Math.max(0, Math.min(100, reorderMarkerPercent))}%` }}
            title="Reorder point"
          />
        )}
      </div>
    </div>
  );
}
