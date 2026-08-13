"use client";

import React from "react";
import { MagnifyingGlassIcon, BellRingingIcon } from "@phosphor-icons/react";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <header className="bg-surface border-b border-outline px-6 py-4 sticky top-0 z-10">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface font-heading">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search Bar */}
          <div className="relative hidden lg:block w-64">
            <MagnifyingGlassIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Search SKUs, products..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-surface-low border border-outline rounded-xl text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all font-body"
            />
          </div>

          {actions}
        </div>
      </div>
    </header>
  );
}