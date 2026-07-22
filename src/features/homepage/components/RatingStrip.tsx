import { Star } from 'lucide-react';

/**
 * Real, site-wide review aggregate (weighted from published products).
 * Renders nothing below a minimum review count — never fabricate trust.
 */
const MIN_REVIEWS_TO_SHOW = 5;

export function RatingStrip({
  average,
  count,
}: {
  average: number;
  count: number;
}) {
  if (count < MIN_REVIEWS_TO_SHOW) return null;

  return (
    <div className="mx-auto max-w-container px-4 lg:px-8">
      <div className="animate-fade-up flex items-center justify-center gap-2 rounded-full border border-border bg-surface-raised px-5 py-2.5 text-sm">
        <span className="flex items-center gap-0.5 text-brand-accent">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="size-4"
              fill={i < Math.round(average) ? 'currentColor' : 'none'}
              strokeWidth={1.5}
            />
          ))}
        </span>
        <span className="font-semibold text-text-primary">{average}</span>
        <span className="text-text-muted">
          from {count.toLocaleString()} reviews
        </span>
      </div>
    </div>
  );
}
