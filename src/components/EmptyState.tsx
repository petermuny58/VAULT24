interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-10 text-center">
      <p className="font-display text-base font-semibold text-text">{title}</p>
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
    </div>
  );
}
