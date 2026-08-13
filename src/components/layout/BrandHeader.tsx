"use client";

import Image from "next/image";
import { SparkleIcon } from "@phosphor-icons/react";

export function BrandHeader() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-secondary/10 flex items-center justify-center border border-secondary/20 shrink-0">
        <Image
          src="/obstocker-logo.jpg"
          alt="Obstocker Logo"
          width={36}
          height={36}
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <h1 className="text-lg font-bold tracking-tight text-on-surface leading-none font-heading">
            Obstocker
          </h1>
          <SparkleIcon size={14} weight="fill" className="text-secondary" />
        </div>
        <span className="text-[11px] font-medium text-on-surface-variant mt-0.5 font-body">
          Inventory Intelligence
        </span>
      </div>
    </div>
  );
}