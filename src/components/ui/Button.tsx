"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--ink)] text-white hover:bg-[var(--ink-hover)] disabled:opacity-55",
  secondary:
    "border border-[var(--border)] bg-white text-[var(--ink)] hover:bg-[var(--surface-muted)] disabled:opacity-55",
  danger:
    "border border-[var(--danger-border)] bg-white text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-55",
  ghost:
    "bg-transparent text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] disabled:opacity-55",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  function Button(
    { variant = "primary", loading, disabled, className = "", children, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={rest.type || "button"}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] ${styles[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
