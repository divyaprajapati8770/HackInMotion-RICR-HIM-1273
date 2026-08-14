"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Warning, Prohibit, TrendDown, CheckCircle } from "@phosphor-icons/react";
import { severityTokens, formatDateTime, cx } from "@/lib/format";
import type { Alert, AlertType } from "@/lib/types";
import { Button } from "@/components/ui/Button";

const TYPE_ICON: Record<AlertType, typeof Warning> = {
  LOW_STOCK: Warning,
  STOCKOUT_IMMINENT: Prohibit,
  OVERSTOCK: TrendDown,
};

interface AlertFeedProps {
  alerts: Alert[];
  onResolve?: (id: number) => void;
  emptyLabel?: string;
  /** Ids currently mid-resolve — disables the button so it can't be double-fired. */
  resolvingIds?: Set<number>;
}

export function AlertFeed({ alerts, onResolve, emptyLabel = "No active alerts — inventory looks healthy.", resolvingIds }: AlertFeedProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline/70 py-10 text-center dark:border-outline/15">
        <CheckCircle size={28} className="text-tertiary" weight="fill" />
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      <AnimatePresence initial={false}>
        {alerts.map((alert) => {
          const tokens = severityTokens[alert.severity];
          const Icon = TYPE_ICON[alert.type];
          return (
            <motion.li
              key={alert.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className={cx("flex items-start gap-3 rounded-xl px-3.5 py-3 ring-1", tokens.bg, tokens.ring)}
            >
              <div className={cx("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface", tokens.text)}>
                <Icon size={15} weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-ink">{alert.productName}</p>
                  <span className={cx("shrink-0 text-[10px] font-mono uppercase tracking-wide", tokens.text)}>
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{alert.message}</p>
                <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(alert.createdAt)}</p>
              </div>
              {onResolve && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResolve(alert.id)}
                  loading={resolvingIds?.has(alert.id)}
                  title={`Mark "${alert.productName}" alert as resolved`}
                  className="shrink-0"
                >
                  Resolve
                </Button>
              )}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
