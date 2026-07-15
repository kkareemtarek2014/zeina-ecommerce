'use client';

import { Check } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { formatEGP } from '@/shared/utils/price';
import { cn } from '@/shared/utils/cn';

interface StickyBuyBarProps {
  visible: boolean;
  price: number;
  compareAtPrice?: number | null;
  canAdd: boolean;
  added: boolean;
  preorderAvailable: boolean;
  inStock: boolean;
  onAdd: () => void;
}

/**
 * Mobile-only fixed buy bar. Shown when the main Add-to-bag control
 * scrolls out of view (thumb-zone CTA).
 */
export function StickyBuyBar({
  visible,
  price,
  compareAtPrice,
  canAdd,
  added,
  preorderAvailable,
  inStock,
  onAdd,
}: StickyBuyBarProps) {
  if (!visible) return null;

  const label = added
    ? 'Added to bag'
    : preorderAvailable && !inStock
      ? 'Pre-order'
      : inStock
        ? 'Add to bag'
        : 'Sold out';

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-raised/95 px-4 py-3 backdrop-blur-sm md:hidden',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        'animate-fade-up',
      )}
      role="region"
      aria-label="Quick add to bag"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-brand-primary">
            {formatEGP(price)}
          </p>
          {compareAtPrice ? (
            <p className="text-xs text-text-muted line-through">
              {formatEGP(compareAtPrice)}
            </p>
          ) : null}
        </div>
        <Button
          size="lg"
          onClick={onAdd}
          disabled={!canAdd}
          className="shrink-0 min-w-36"
        >
          {added ? (
            <>
              <Check className="size-5" /> {label}
            </>
          ) : (
            label
          )}
        </Button>
      </div>
    </div>
  );
}
