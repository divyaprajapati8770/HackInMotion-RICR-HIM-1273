/**
 * Literal hex values for anywhere a real CSS color string is required
 * rather than a Tailwind class — Recharts renders raw SVG attributes
 * (stroke, fill) and Three.js materials take actual color values, neither
 * of which can consume a `var(--color-x)` reference reliably in all
 * contexts. This file exists so those values live in exactly one place
 * instead of being retyped per chart component.
 *
 * These MUST stay in sync with the CSS custom properties defined in
 * app/globals.css — that file is the source of truth for every other
 * color in the app (Tailwind utility classes, component styling); this
 * file mirrors the same palette for the handful of call sites that can't
 * consume CSS variables directly. If you change a value in globals.css,
 * change it here too.
 */
export const theme = {
  primary: "#0F172A",
  secondary: "#4F46E5",
  tertiary: "#10B981",
  alert: "#F59E0B",
  critical: "#EF4444",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  onSurfaceVariant: "#64748B", // slate-500, chart axis labels/gridlines
  outline: "#E2E8F0", // slate-200, chart gridlines/borders
} as const;

/** Category donut chart palette — cycles through the brand + status hues. */
export const categoryPalette = [
  theme.secondary,
  theme.tertiary,
  theme.alert,
  theme.critical,
  theme.onSurfaceVariant,
  "#A5A6F5", // indigo-300, a lighter tint for extra categories beyond the core five
  "#34D399", // emerald-400
  "#D97706", // amber-600
] as const;

/**
 * Dark-mode counterpart for the small set of values above that get used
 * as literal solid fills rather than semantic strokes/gradients (e.g. the
 * confidence-band "erase" area in ForecastChart, which needs to match
 * whatever the card's actual background is, light or dark — a hardcoded
 * white fill there would paint a visible white block over a dark card).
 */
export const themeDark = {
  surface: "#0F172A",
  outline: "#FFFFFF1A", // white at ~10% alpha, matches the outline token's dark-mode intent
  onSurfaceVariant: "#94A3B8", // slate-400
} as const;
