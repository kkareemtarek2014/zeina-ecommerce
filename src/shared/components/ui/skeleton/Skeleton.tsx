import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /** Pill / avatar shapes. */
  circle?: boolean;
};

/** Decorative loading block — parent should set `aria-busy` when appropriate. */
export function Skeleton({ circle, className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'skeleton-shimmer',
        circle ? 'rounded-full' : 'rounded-(--radius)',
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3'] as const;

  return (
    <div className={cn('space-y-2', className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', widths[i % widths.length], i === lines - 1 && lines > 1 && 'w-1/2')}
        />
      ))}
    </div>
  );
}

export function SkeletonImage({
  aspect = 'square',
  className,
}: {
  aspect?: 'square' | 'portrait' | 'hero' | 'video';
  className?: string;
}) {
  const aspectClass =
    aspect === 'square'
      ? 'aspect-square'
      : aspect === 'portrait'
        ? 'aspect-3/4'
        : aspect === 'hero'
          ? 'aspect-4/3'
          : 'aspect-video';

  return (
    <Skeleton
      className={cn('w-full rounded-lg', aspectClass, className)}

    />
  );
}
