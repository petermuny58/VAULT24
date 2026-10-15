import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-text hover:brightness-110 disabled:opacity-50",
  secondary:
    "bg-surface-raised text-text border border-border hover:bg-surface disabled:opacity-50",
  danger:
    "bg-danger text-white hover:brightness-110 disabled:opacity-50",
  ghost:
    "bg-transparent text-muted hover:text-text hover:bg-surface-raised disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
