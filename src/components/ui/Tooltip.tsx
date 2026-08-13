"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cx } from "@/lib/format";

/**
 * App-wide tooltip. Wrap the single global Provider once (see
 * TooltipProvider below, mounted in the dashboard layout) and use
 * <Tooltip label="..."><button>...</button></Tooltip> anywhere an
 * icon-only control needs an accessible name beyond its title attribute.
 */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={100}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ label, children, side = "top" }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cx(
            "z-50 rounded-md bg-brand-primary px-2.5 py-1.5 text-xs font-medium text-white shadow-popover",
            "animate-fade-up data-[state=closed]:hidden"
          )}
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-brand-primary" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
