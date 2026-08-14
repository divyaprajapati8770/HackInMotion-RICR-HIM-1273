"use client";

import { useCallback, useRef } from "react";
import type { MouseEvent } from "react";

/**
 * Cursor-tracked 3D tilt + spotlight, driven entirely through CSS custom
 * properties mutated directly on the DOM node — deliberately not React
 * state. A tilt effect fires on every mousemove; routing that through
 * setState would re-render the card (and everything under it) 60+ times a
 * second. Writing to el.style instead keeps the whole interaction on the
 * compositor thread. Pair with .tilt-card and .tilt-spotlight in
 * globals.css, which read these properties.
 */
export function useTilt<T extends HTMLElement>(strength = 8) {
  const ref = useRef<T>(null);

  const onMouseMove = useCallback(
    (e: MouseEvent<T>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      el.style.setProperty("--tilt-x", `${((0.5 - py) * strength).toFixed(2)}deg`);
      el.style.setProperty("--tilt-y", `${((px - 0.5) * strength).toFixed(2)}deg`);
      el.style.setProperty("--spot-x", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--spot-y", `${(py * 100).toFixed(1)}%`);
    },
    [strength]
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
