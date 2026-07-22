'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { formatEGP } from '@/shared/utils/price';
import { FREE_SHIPPING_THRESHOLD } from '@/config/site.config';
import { useStorefrontConfig } from '@/features/admin';
import { Button, Drawer, QuantityStepper } from '@/shared/components/ui';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { markOverlayNavigation } from '@/shared/hooks/useBackButtonClose';
import { CartRecommendations } from './CartRecommendations';
import { FreeShippingProgress } from './FreeShippingProgress';
import {
  selectCartCount,
  selectCartSubtotal,
  selectCartDiscount,
  selectCartTotal,
  useCartStore,
} from '../store/cart.store';

/** Header cart button + full-height mobile cart sheet. */
export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const mounted = useHydrated();
  const items = useCartStore((s) => s.items);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const discount = useCartStore(selectCartDiscount);
  const total = useCartStore(selectCartTotal);
  const couponCode = useCartStore((s) => s.couponCode);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  /**
   * Close the drawer as part of a client navigation. `markOverlayNavigation`
   * stops `useBackButtonClose` from firing `history.back()` on this close, which
   * would otherwise race and cancel the link's forward navigation (App Router
   * pushes its history entry asynchronously). Used for every link inside the
   * drawer; the X / backdrop / Esc keep the plain `closeDrawer`.
   */
  const closeForNav = () => {
    markOverlayNavigation();
    closeDrawer();
  };

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const { data: storefrontConfig } = useStorefrontConfig();
  const freeShippingThreshold =
    storefrontConfig?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD;

  const discountedSubtotal = subtotal - discount;
  const remainingForFree = freeShippingThreshold - discountedSubtotal;

  const footer =
    items.length > 0 ? (
      <>
        <FreeShippingProgress
          className="mb-3"
          remainingForFree={remainingForFree}
          threshold={freeShippingThreshold}
        />

        <div className="mb-4">
          {couponCode ? (
            <div className="flex items-center justify-between rounded-(--radius) bg-brand-blush px-3 py-2 text-sm">
              <span className="font-medium text-brand-primary">
                Code: {couponCode}
              </span>
              <button
                type="button"
                onClick={() => {
                  removeCoupon();
                  setCouponError(null);
                }}
                className="text-xs text-brand-secondary underline"
              >
                Remove
              </button>
            </div>
          ) : couponOpen ? (
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon Code (e.g. WELCOME10)"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    setCouponError(null);
                  }}
                  className="flex-1 rounded-(--radius) border border-border px-3 py-1.5 text-base outline-none focus:border-brand-primary sm:text-sm"
                  aria-label="Coupon code"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!couponInput) return;
                    const res = await applyCoupon(couponInput);
                    if (res.success) {
                      setCouponInput('');
                      setCouponError(null);
                    } else {
                      setCouponError(res.error || 'Invalid code');
                    }
                  }}
                >
                  Apply
                </Button>
              </div>
              {couponError ? (
                <p className="ml-1 text-xs text-status-error">{couponError}</p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setCouponOpen(false);
                  setCouponError(null);
                  setCouponInput('');
                }}
                className="self-start text-xs text-text-muted underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCouponOpen(true)}
              className="text-xs font-medium text-text-secondary underline underline-offset-2 hover:text-brand-primary"
            >
              Have a code?
            </button>
          )}
        </div>

        <div className="mb-3 space-y-1 text-sm">
          <div className="flex items-center justify-between text-text-secondary">
            <span>Subtotal</span>
            <span>{formatEGP(subtotal)}</span>
          </div>
          {discount > 0 ? (
            <div className="flex items-center justify-between text-status-success">
              <span>Discount</span>
              <span>-{formatEGP(discount)}</span>
            </div>
          ) : null}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span>{formatEGP(total)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/checkout"
            onClick={closeForNav}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-(--radius) bg-brand-primary px-6 text-sm font-medium tracking-wide text-text-inverse shadow-sm transition-colors hover:bg-brand-secondary active:scale-[0.97]"
          >
            Checkout
          </Link>
          <Link
            href="/cart"
            onClick={closeForNav}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-(--radius) border border-border-strong px-6 text-sm font-medium tracking-wide text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary active:scale-[0.97]"
          >
            View full bag
          </Link>
        </div>
      </>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        aria-label={`Open cart${mounted && count > 0 ? ` (${count} items)` : ''}`}
        className="relative flex size-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-brand-blush"
      >
        <ShoppingBag className="size-5" />
        {mounted && count > 0 ? (
          <span
            key={count}
            className="animate-pop absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-brand-primary text-[10px] font-semibold text-text-inverse"
          >
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>

      <Drawer
        isOpen={isOpen}
        onClose={closeDrawer}
        title={`Your Bag${mounted && count > 0 ? ` (${count})` : ''}`}
        fullWidthMobile
        footer={footer}
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <ShoppingBag className="size-12 text-border-strong" />
            <p className="text-sm text-text-secondary">Your bag is empty.</p>
            <Link
              href="/shop"
              onClick={closeForNav}
              className="flex h-11 items-center justify-center gap-2 rounded-(--radius) border border-border-strong px-6 text-sm font-medium tracking-wide text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary active:scale-[0.97]"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 py-4">
                  <Link
                    href={`/product/${item.productId}`}
                    onClick={closeForNav}
                    className="relative size-16 shrink-0 overflow-hidden rounded-(--radius) bg-brand-blush"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={128}
                      height={128}
                      sizes="64px"
                      className="size-full object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.productId}`}
                        onClick={closeForNav}
                        className="line-clamp-2 text-xs font-medium hover:text-brand-primary"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.productId)}
                        className="text-text-muted transition-colors hover:text-status-error"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(q) => setQuantity(item.productId, q)}
                        className="h-11 sm:h-8 [&>button]:w-11 sm:[&>button]:w-8 [&>span]:w-11 sm:[&>span]:w-8"
                      />
                      <span className="text-sm font-semibold text-brand-primary">
                        {formatEGP(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <CartRecommendations
                remainingForFree={remainingForFree}
                onNavigate={closeForNav}
              />
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}
