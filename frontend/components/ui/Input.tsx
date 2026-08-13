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
          <label htmlFor={id} className="text-xs font-medium text-slate-600">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cx(
            "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400",
            "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-shadow",
            error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
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
          <label htmlFor={id} className="text-xs font-medium text-slate-600">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cx(
            "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink",
            "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-shadow",
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
