import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  variant?: "info" | "success" | "error";
  onDismiss: () => void;
}

export function Toast({ message, variant = "info", onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  const colors =
    variant === "success"
      ? "border-success/40 bg-success/15 text-success"
      : variant === "error"
        ? "border-danger/40 bg-danger/15 text-danger"
        : "border-accent/40 bg-accent/15 text-accent";

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border px-4 py-3 text-sm shadow-lg ${colors}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-xs font-semibold uppercase tracking-wide opacity-80 hover:opacity-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
