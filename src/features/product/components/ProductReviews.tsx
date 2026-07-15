'use client';

import { Star, ThumbsUp } from 'lucide-react';
import { ReviewsSkeleton } from '@/shared/components/ui';
import { useReviews } from '../hooks/useReviews';

function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data, isLoading, error } = useReviews(productId);

  if (isLoading) {
    return <ReviewsSkeleton />;
  }

  if (error || !data) {
    return (
      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-2xl font-semibold text-brand-primary">
          Customer Reviews
        </h2>
        <p className="mt-4 text-sm text-text-secondary">
          Be the first to review after your order.
        </p>
      </section>
    );
  }

  const { summary, items } = data;
  const starsFilled = Math.round(summary.average);

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="font-display text-2xl font-semibold text-brand-primary">
        Customer Reviews
      </h2>

      {summary.count === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          Be the first to review after your order.
        </p>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-4">
              <h3 className="text-5xl font-bold text-text-primary">
                {summary.average.toFixed(1)}
              </h3>
              <div className="flex flex-col gap-1">
                <div className="flex text-brand-accent">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-5 ${
                        i < starsFilled
                          ? 'fill-current'
                          : 'fill-transparent text-border-strong'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-text-secondary">
                  Based on {summary.count} review
                  {summary.count === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = summary.breakdown[String(rating)] ?? 0;
                const pct =
                  summary.count > 0
                    ? Math.round((count / summary.count) * 100)
                    : 0;
                return (
                  <div
                    key={rating}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-2 font-medium">{rating}</span>
                    <Star className="size-3 fill-current text-brand-accent" />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-blush">
                      <div
                        className="h-full rounded-full bg-brand-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 pr-2">
            <div className="custom-scrollbar max-h-75 space-y-4 overflow-y-auto pr-4">
              {items.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-border pb-4 last:border-0"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-text-primary">
                        {review.authorName}
                      </h4>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex text-brand-accent">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3 ${
                                i < review.rating
                                  ? 'fill-current'
                                  : 'fill-transparent text-border-strong'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-text-muted">
                          {formatRelativeDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {review.comment}
                  </p>
                  <button
                    type="button"
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-brand-primary"
                  >
                    <ThumbsUp className="size-3.5" />
                    Helpful ({review.helpful})
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
