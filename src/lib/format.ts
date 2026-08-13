import type { AlertSeverity, StockStatus, TrendDirection } from "./types";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(value));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const stockStatusTokens: Record<
  StockStatus,
  { label: string; text: string; bg: string; bar: string; dot: string }
> = {
  HEALTHY: { label: "Healthy", text: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-400", dot: "bg-emerald-400" },
  LOW: { label: "Low stock", text: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-400", dot: "bg-amber-400" },
  CRITICAL: { label: "Critical", text: "text-rose-600", bg: "bg-rose-50", bar: "bg-rose-500", dot: "bg-rose-500" },
  OVERSTOCK: { label: "Overstocked", text: "text-indigo-600", bg: "bg-indigo-50", bar: "bg-indigo-500", dot: "bg-indigo-500" },
};

export const severityTokens: Record<AlertSeverity, { text: string; bg: string; ring: string }> = {
  LOW: { text: "text-slate-600", bg: "bg-slate-100", ring: "ring-slate-200" },
  MEDIUM: { text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200" },
  HIGH: { text: "text-amber-700", bg: "bg-amber-100", ring: "ring-amber-300" },
  CRITICAL: { text: "text-rose-700", bg: "bg-rose-50", ring: "ring-rose-200" },
};

export const trendTokens: Record<TrendDirection, { label: string; text: string }> = {
  UP: { label: "Trending up", text: "text-emerald-600" },
  DOWN: { label: "Trending down", text: "text-rose-600" },
  STABLE: { label: "Stable", text: "text-slate-500" },
};

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
