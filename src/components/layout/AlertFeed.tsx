"use client";

import { AlertTriangleIcon, CheckCircleIcon, TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react";
import type { Alert } from "@/lib/types";

interface AlertFeedProps {
  alerts: Alert[];
  onResolve: (id: number) => void;
}

export function AlertFeed({ alerts, onResolve }: AlertFeedProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="py-8 text-center bg-surface-low/30 rounded-xl border border-dashed border-outline">
        <CheckCircleIcon size={32} weight="duotone" className="mx-auto text-tertiary mb-2" />
        <p className="text-xs font-semibold text-on-surface">All inventory healthy</p>
        <p className="text-[11px] text-on-surface-variant mt-0.5">No critical stockouts or overstock warnings detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isCritical = alert.severity === "CRITICAL";
        const isOverstock = alert.alertType === "OVERSTOCK";

        return (
          <div
            key={alert.id}
            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isCritical
                ? "bg-red-500/5 border-red-500/20"
                : isOverstock
                ? "bg-indigo-500/5 border-indigo-500/20"
                : "bg-amber-500/5 border-amber-500/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  isCritical
                    ? "bg-red-500/10 text-red-500"
                    : isOverstock
                    ? "bg-indigo-500/10 text-secondary"
                    : "bg-amber-500/10 text-amber-500"
                }`}
              >
                {isOverstock ? (
                  <TrendUpIcon size={18} weight="bold" />
                ) : (
                  <AlertTriangleIcon size={18} weight="bold" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-on-surface font-heading">
                    {alert.productName}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                      isCritical
                        ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                        : isOverstock
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {alert.alertType}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 font-body leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>

            <button
              onClick={() => onResolve(alert.id)}
              className="px-3 py-1.5 text-xs font-semibold text-on-surface border border-outline hover:bg-surface-low rounded-lg transition-colors shrink-0 self-end sm:self-center"
            >
              Resolve
            </button>
          </div>
        );
      })}
    </div>
  );
}