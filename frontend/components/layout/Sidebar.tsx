"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  SquaresFour,
  Package,
  UploadSimple,
  ChartLineUp,
  BellRinging,
  Flask,
  Gear,
} from "@phosphor-icons/react";
import { cx } from "@/lib/format";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { BrandHeader } from "@/components/layout/BrandHeader";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/sales", label: "Sales Data", icon: UploadSimple },
  { href: "/forecasts", label: "Forecasts", icon: ChartLineUp },
  { href: "/alerts", label: "Alerts", icon: BellRinging },
  { href: "/whatif", label: "What-If", icon: Flask },
  { href: "/settings", label: "Settings", icon: Gear },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-white/15 bg-surface/80 backdrop-blur-xl dark:border-white/10 dark:bg-surface/60 z-40">
      <div className="flex items-center px-6 h-16 border-b border-slate-100/70 dark:border-white/10">
        <BrandHeader />
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-5 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cx(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-indigo-600 dark:text-indigo-300"
                  : "text-slate-600 hover:text-ink dark:hover:text-white"
              )}
            >
              {active && (
                // layoutId makes the pill glide between nav items on route
                // change instead of popping — framer-motion auto-computes
                // the FLIP transform between the previous and new position.
                <motion.span
                  layoutId="sidebar-active-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-lg bg-indigo-50 dark:bg-indigo-500/15"
                />
              )}
              {!active && (
                <span className="absolute inset-0 scale-95 rounded-lg bg-slate-50 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 dark:bg-white/5" />
              )}
              <Icon
                size={18}
                weight={active ? "fill" : "regular"}
                className="relative z-10 shrink-0 transition-transform duration-200 group-hover:scale-110"
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <AccountMenu />
    </aside>
  );
}
