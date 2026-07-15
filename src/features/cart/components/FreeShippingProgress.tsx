'use client';

import { Check } from 'lucide-react';
import { formatEGP } from '@/shared/utils/price';
import { cn } from '@/shared/utils/cn';

interface FreeShippingProgressProps {
  remainingForFree: number;
  threshold: number;
  className?: string;
  /** Slightly roomier padding on the full cart page. */
  size?: 'sm' | 'md';
}

/**
 * Thin goal-gradient bar toward free shipping. Text alone converts less well.
 */
export function FreeShippingProgress({
  remainingForFree,
  threshold,
  className,
  size = 'sm',
}: FreeShippingProgressProps) {
  const unlocked = remainingForFree <= 0;
  const progress = unlocked
    ? 100
    : Math.min(
        100,
        Math.max(0, ((threshold - remainingForFree) / threshold) * 100),
      );

  return (
    <div
      className={cn(
        'rounded-(--radius)',
        unlocked ? 'bg-status-success/10' : 'bg-brand-blush',
        size === 'sm' ? 'px-3 py-2' : 'px-4 py-3',
        className,
      )}
    >
      <div
        className="mb-1.5 h-1 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label={
          unlocked
            ? 'Free shipping unlocked'
            : `${formatEGP(remainingForFree)} remaining for free shipping`
        }
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none',
            unlocked ? 'bg-status-success' : 'bg-brand-primary',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      {unlocked ? (
        <p className="flex items-center gap-1.5 text-xs text-status-success">
          <Check className="size-3.5 shrink-0" aria-hidden />
          You’ve unlocked <strong>free shipping</strong>!
        </p>
      ) : (
        <p className="text-xs text-brand-secondary">
          Add {formatEGP(remainingForFree)} more for{' '}
          <strong>free shipping</strong>.
        </p>
      )}
    </div>
  );
}
