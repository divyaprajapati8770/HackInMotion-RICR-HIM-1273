import { cx } from "@/lib/format";
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cx(
            "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400",
            "dark:border-slate-700 dark:bg-slate-900/90 dark:text-white dark:placeholder:text-slate-500",
            "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-950/50 outline-none transition-all",
            error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-500",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-rose-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cx(
            "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink",
            "dark:border-slate-700 dark:bg-slate-900/90 dark:text-white",
            "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-950/50 outline-none transition-all",
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";
