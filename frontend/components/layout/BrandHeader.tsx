"use client";

import Image from "next/image";
import { SparkleIcon } from "@phosphor-icons/react";

interface BrandHeaderProps {
  size?: "sm" | "lg";
  light?: boolean;
}

export function BrandHeader({ size = "sm", light = false }: BrandHeaderProps) {
  const isLg = size === "lg";

  return (
    <div className={`flex items-center gap-3 ${isLg ? "px-6 py-4" : "px-4 py-3"}`}>
      <div className={`relative ${isLg ? "w-11 h-11" : "w-9 h-9"} rounded-xl overflow-hidden dark:bg-white flex items-center justify-center shrink-0`}>
        <Image
          src="/images/logo.png"
          alt="Obstocker Logo"
          width={isLg ? 44 : 36}
          height={isLg ? 44 : 36}
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <h1 className={`font-bold tracking-tight leading-none font-heading ${isLg ? "text-xl" : "text-lg"} ${light ? "text-white" : "text-on-surface"}`}>
            Obstocker
          </h1>
          <SparkleIcon size={isLg ? 16 : 14} weight="fill" className="text-secondary" />
        </div>
        <span className={`font-medium mt-0.5 font-body ${isLg ? "text-xs" : "text-[11px]"} ${light ? "text-white/70" : "text-on-surface-variant"}`}>
          Inventory Intelligence
        </span>
      </div>
    </div>
  );
}