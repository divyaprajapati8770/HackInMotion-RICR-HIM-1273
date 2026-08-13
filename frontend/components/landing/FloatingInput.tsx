"use client";

import { useId, useState } from "react";
import { cx } from "@/lib/format";

interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  as?: "input" | "textarea";
  rows?: number;
}

export function FloatingInput({ label, value, onChange, type = "text", error, as = "input", rows = 4 }: FloatingInputProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  const sharedProps = {
    id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    className: cx(
      "peer w-full rounded-lg border bg-white px-3.5 pt-5 pb-2 text-sm text-ink outline-none transition-shadow",
      "focus:ring-2 focus:ring-indigo-100",
      error ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-indigo-400"
    ),
  };

  return (
    <div className="relative">
      {as === "textarea" ? (
        <textarea {...sharedProps} rows={rows} />
      ) : (
        <input {...sharedProps} type={type} />
      )}
      <label
        htmlFor={id}
        className={cx(
          "pointer-events-none absolute left-3.5 text-slate-400 transition-all duration-150",
          floated
            ? "top-2 text-[10px] font-medium text-indigo-500"
            : as === "textarea"
              ? "top-4 text-sm"
              : "top-1/2 -translate-y-1/2 text-sm"
        )}
      >
        {label}
      </label>
      {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
