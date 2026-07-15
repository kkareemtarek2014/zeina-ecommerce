'use client';

import { Bell } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useHydrated } from '@/shared/hooks/useHydrated';
import {
  useToggleWishlistAlert,
  useWishlistAlerts,
} from '../hooks/useWishlistAlerts';
import { cn } from '@/shared/utils/cn';

interface WishlistAlertControlsProps {
  productId: string;
  /** Only meaningful when the product is already favorited. */
  favorited: boolean;
  className?: string;
}

/**
 * Auth-only price-drop + restock alert toggles for favorited products.
 */
export function WishlistAlertControls({
  productId,
  favorited,
  className,
}: WishlistAlertControlsProps) {
  const hydrated = useHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const enabled = hydrated && isAuthenticated && favorited;
  const { data: alerts = [] } = useWishlistAlerts(Boolean(enabled));
  const toggle = useToggleWishlistAlert();

  if (!enabled) return null;

  const isOn = (type: 'price_drop' | 'restock') =>
    alerts.some(
      (a) => a.productId === productId && a.alertType === type && a.enabled,
    );

  const onToggle = (type: 'price_drop' | 'restock', next: boolean) => {
    void toggle.mutateAsync({
      productId,
      alertType: type,
      enabled: next,
    });
  };

  return (
    <div
      className={cn(
        'rounded-(--radius) border border-border bg-surface-raised px-3 py-2 text-xs',
        className,
      )}
    >
      <p className="mb-2 flex items-center gap-1.5 font-medium text-text-secondary">
        <Bell className="size-3.5 text-brand-accent" aria-hidden />
        Notify me
      </p>
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 text-text-secondary">
          <input
            type="checkbox"
            className="size-3.5 accent-brand-primary"
            checked={isOn('price_drop')}
            disabled={toggle.isPending}
            onChange={(e) => onToggle('price_drop', e.target.checked)}
          />
          Price drop
        </label>
        <label className="flex items-center gap-2 text-text-secondary">
          <input
            type="checkbox"
            className="size-3.5 accent-brand-primary"
            checked={isOn('restock')}
            disabled={toggle.isPending}
            onChange={(e) => onToggle('restock', e.target.checked)}
          />
          Back in stock
        </label>
      </div>
    </div>
  );
}
