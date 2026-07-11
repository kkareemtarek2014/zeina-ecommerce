'use client';


import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { formatEGP } from '@/shared/utils/price';
import { FREE_SHIPPING_THRESHOLD } from '@/config/site.config';
import { Button, Drawer, QuantityStepper } from '@/shared/components/ui';
import { useHydrated } from '@/shared/hooks/useHydrated';
import {
  selectCartCount,
  selectCartSubtotal,
  selectCartDiscount,
  selectCartTotal,
  useCartStore,
} from '../store/cart.store';

/** Header cart button + slide-in cart panel (reference: CartSidebar). */
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
  
  const [couponInput, setCouponInput] = useState('');

  const remainingForFree = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        aria-label={`Open cart${mounted && count > 0 ? ` (${count} items)` : ''}`}
        className="relative flex size-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-brand-blush"
      >
        <ShoppingBag className="size-5" />
        {mounted && count > 0 && (
          <span
            key={count}
            className="animate-pop absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-brand-primary text-[10px] font-semibold text-text-inverse"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <Drawer
        isOpen={isOpen}
        onClose={closeDrawer}
        title={`Your Bag${mounted && count > 0 ? ` (${count})` : ''}`}
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <ShoppingBag className="size-12 text-border-strong" />
            <p className="text-sm text-text-secondary">Your bag is empty.</p>
            <Link href="/shop" onClick={closeDrawer}>
              <Button variant="outline">Start shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex-1 divide-y divide-border">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 py-4">
                  <Link
                    href={`/product/${item.productId}`}
                    onClick={closeDrawer}
                    className="relative size-16 shrink-0 overflow-hidden rounded-(--radius) bg-brand-blush"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={128}
                      height={128}
                      className="size-full object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.productId}`}
                        onClick={closeDrawer}
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
                        className="h-8 [&>span]:w-8 [&>button]:w-8"
                      />
                      <span className="text-sm font-semibold text-brand-primary">
                        {formatEGP(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 -mx-5 mt-4 border-t border-border bg-surface-raised px-5 pb-2 pt-4">
              {remainingForFree > 0 ? (
                <p className="mb-3 rounded-(--radius) bg-brand-blush px-3 py-2 text-xs text-brand-secondary">
                  Add {formatEGP(remainingForFree)} more for{' '}
                  <strong>free shipping</strong>.
                </p>
              ) : (
                <p className="mb-3 rounded-(--radius) bg-status-success/10 px-3 py-2 text-xs text-status-success">
                  You’ve unlocked <strong>free shipping</strong>!
                </p>
              )}

              <div className="mb-4">
                {couponCode ? (
                  <div className="flex items-center justify-between rounded-(--radius) bg-brand-blush px-3 py-2 text-sm">
                    <span className="font-medium text-brand-primary">Code: {couponCode}</span>
                    <button type="button" onClick={removeCoupon} className="text-brand-secondary underline text-xs">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Coupon Code (e.g. ZAYA10)" 
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 rounded-(--radius) border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-primary"
                    />
                    <Button variant="outline" size="sm" onClick={() => { applyCoupon(couponInput); setCouponInput(''); }}>Apply</Button>
                  </div>
                )}
              </div>

              <div className="mb-3 space-y-1 text-sm">
                <div className="flex items-center justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>{formatEGP(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-status-success">
                    <span>Discount</span>
                    <span>-{formatEGP(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between font-semibold pt-2 border-t border-border mt-2">
                  <span>Total</span>
                  <span>{formatEGP(total)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link href="/checkout" onClick={closeDrawer}>
                  <Button fullWidth>Checkout</Button>
                </Link>
                <Link href="/cart" onClick={closeDrawer}>
                  <Button fullWidth variant="outline">
                    View full bag
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
