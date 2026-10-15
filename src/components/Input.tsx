import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className = "", id, ...props }: InputProps) {
  return (
    <input
      id={id}
      className={`w-full rounded-xl border bg-bg px-3.5 py-2.5 text-sm text-text placeholder:text-muted/70 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        invalid ? "border-danger" : "border-border"
      } ${className}`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
