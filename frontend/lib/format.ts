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

// Same alpha-tint reasoning as severityTokens below — `bg` is used for
// status chips, so it must compose against both light and dark surfaces.
// `bar`/`dot` stay solid since they're foreground marks, not backgrounds.
export const stockStatusTokens: Record<
  StockStatus,
  { label: string; text: string; bg: string; bar: string; dot: string }
> = {
  HEALTHY: { label: "Healthy", text: "text-tertiary", bg: "bg-tertiary/10", bar: "bg-tertiary", dot: "bg-tertiary" },
  LOW: { label: "Low stock", text: "text-alert", bg: "bg-alert/10", bar: "bg-alert", dot: "bg-alert" },
  CRITICAL: { label: "Critical", text: "text-critical", bg: "bg-critical/10", bar: "bg-critical", dot: "bg-critical" },
  OVERSTOCK: { label: "Overstocked", text: "text-secondary", bg: "bg-secondary/10", bar: "bg-secondary", dot: "bg-secondary" },
};

// Alpha-based tints (e.g. bg-critical/10) rather than fixed-lightness
// scale steps (bg-rose-50): a `-50` tint stays pale in dark mode, so the
// alert row would render as a bright light block on the dark surface.
// Alpha tints compose against whatever surface is underneath, so the same
// token reads correctly in both themes.
export const severityTokens: Record<AlertSeverity, { text: string; bg: string; ring: string }> = {
  LOW: { text: "text-slate-600 dark:text-slate-300", bg: "bg-slate-500/10", ring: "ring-slate-500/20" },
  MEDIUM: { text: "text-alert", bg: "bg-alert/10", ring: "ring-alert/20" },
  HIGH: { text: "text-alert", bg: "bg-alert/15", ring: "ring-alert/25" },
  CRITICAL: { text: "text-critical", bg: "bg-critical/10", ring: "ring-critical/20" },
};

export const trendTokens: Record<TrendDirection, { label: string; text: string }> = {
  UP: { label: "Trending up", text: "text-emerald-600" },
  DOWN: { label: "Trending down", text: "text-rose-600" },
  STABLE: { label: "Stable", text: "text-slate-500" },
};

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
