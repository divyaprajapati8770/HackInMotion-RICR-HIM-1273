"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

/**
 * Wraps next-themes: toggles a `.dark` class on <html>, which flips the
 * CSS variables defined in globals.css (--color-ink/canvas/surface).
 * Combined with `suppressHydrationWarning` on <html> in layout.tsx, this
 * avoids the classic flash-of-wrong-theme — next-themes injects a tiny
 * blocking inline script that sets the class before first paint, so
 * there's no light-mode flash before a saved dark preference applies.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  );
}
