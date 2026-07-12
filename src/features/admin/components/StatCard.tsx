interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
}

export function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <div className="rounded-(--radius-lg) border border-border bg-brand-blush/30 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {title}
      </p>
      <p className="mt-2 font-(family-name:--font-display) text-2xl font-semibold text-brand-primary">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}
