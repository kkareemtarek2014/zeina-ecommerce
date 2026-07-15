'use client';

import { formatEGP } from '@/shared/utils/price';
import { useCartRecommendations } from '../hooks/useCartRecommendations';
import { CartRecommendationCard } from './CartRecommendationCard';

interface CartRecommendationsProps {
  /** Override section heading. When omitted, uses gap-aware or “Complete the look”. */
  title?: string;
  /** EGP remaining to free shipping — drives gap-closing sort + title. */
  remainingForFree?: number;
  /** Called when a recommendation link is followed (e.g. close the drawer). */
  onNavigate?: () => void;
}

/**
 * Horizontal cart suggestions. CSS scroll-snap only — no carousel library.
 * Default framing: “Complete the look”; gap-aware when close to free shipping.
 */
export function CartRecommendations({
  title,
  remainingForFree,
  onNavigate,
}: CartRecommendationsProps) {
  const { products, gapAware } = useCartRecommendations(8, remainingForFree);

  if (products.length === 0) return null;

  const heading =
    title ??
    (gapAware && remainingForFree != null
      ? `Add ${formatEGP(remainingForFree)} for free shipping — complete with:`
      : 'Complete the look');

  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">{heading}</h3>
      <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
        {products.map((product) => (
          <CartRecommendationCard
            key={product.id}
            product={product}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}
