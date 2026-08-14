"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Gear,
  User,
  ShieldCheck,
  PaintBrush,
  SignOut,
  Sun,
  Moon,
  Monitor,
} from "@phosphor-icons/react";
import { cx } from "@/lib/format";
import { useAuthStore } from "@/lib/auth-store";

/**
 * Sidebar's bottom account button, redesigned as an interactive Radix
 * Popover that launches upward (side="top") — the trigger sits at the
 * bottom of the sidebar, so an ordinary downward menu would run off the
 * viewport.
 *
 * Note on scope: "General Settings", "Account Details", and "Privacy &
 * Security" currently all route to the single existing /settings page
 * (there's one settings page in the app today, not three dedicated
 * sub-pages) — building those out as distinct routes is real, separate
 * follow-up work, not done here. "Appearance & Theme" is fully functional
 * now: it's an inline light/dark/system toggle via next-themes, not a link.
 */
export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { businessName, email, clearSession } = useAuthStore();
  const { theme, setTheme } = useTheme();

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const menuItems = [
    { label: "General Settings", icon: Gear, href: "/settings" },
    { label: "Account Details", icon: User, href: "/settings" },
    { label: "Privacy & Security", icon: ShieldCheck, href: "/settings" },
  ];

  const themeOptions: { value: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="border-t border-slate-100 dark:border-white/10 p-4">
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            title={`Account menu for ${businessName || "your business"}`}
            className={cx(
              "flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
              "hover:bg-slate-50 dark:hover:bg-white/5",
              open && "bg-slate-50 dark:bg-white/5"
            )}
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-semibold font-display">
              {(businessName || "B").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{businessName || "Your business"}</p>
              <p className="truncate text-xs text-slate-400">{email}</p>
            </div>
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side="top"
            align="start"
            sideOffset={10}
            className="z-50 w-64 rounded-xl2 border border-slate-100 dark:border-white/10 bg-surface p-1.5 shadow-popover outline-none"
            asChild
          >
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      title={item.label}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-ink dark:hover:bg-white/5 dark:text-slate-300 transition-colors"
                    >
                      <Icon size={17} />
                      {item.label}
                    </Link>
                  );
                })}

                <div className="my-1.5 h-px bg-slate-100 dark:bg-white/10" />

                <div className="px-3 py-2">
                  <p className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <PaintBrush size={15} />
                    Appearance & Theme
                  </p>
                  <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-50 dark:bg-white/5 p-1">
                    {themeOptions.map((opt) => {
                      const Icon = opt.icon;
                      const active = theme === opt.value;
                      return (
                        <button
                          key={opt.value}
                          title={`${opt.label} theme`}
                          onClick={() => setTheme(opt.value)}
                          className={cx(
                            "flex flex-col items-center gap-1 rounded-md py-1.5 text-[10px] font-medium transition-colors",
                            active
                              ? "bg-surface text-indigo-600 shadow-sm"
                              : "text-slate-500 hover:text-ink"
                          )}
                        >
                          <Icon size={14} weight={active ? "fill" : "regular"} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="my-1.5 h-px bg-slate-100 dark:bg-white/10" />

                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                >
                  <SignOut size={17} />
                  Log out
                </button>
              </motion.div>
            </AnimatePresence>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}
