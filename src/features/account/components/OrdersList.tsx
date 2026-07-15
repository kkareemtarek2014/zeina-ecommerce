'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { formatEGP } from '@/shared/utils/price';
import { AccountListSkeleton, Badge, Button } from '@/shared/components/ui';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { useMyOrders } from '@/features/order/hooks/useOrders';
import { RateOrderItems } from './RateOrderItems';

export function OrdersList() {
  const mounted = useHydrated();
  const { data: orders = [], isLoading, isError } = useMyOrders();

  if (!mounted || isLoading) {
    return <AccountListSkeleton />;
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-status-error">
        Could not load your orders. Please try again.
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Package className="size-12 text-border-strong" />
        <p className="text-sm text-text-secondary">No orders yet.</p>
        <Link href="/shop">
          <Button variant="outline">Start shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li
          key={order.id}
          className="overflow-hidden rounded-lg border border-border bg-surface-raised"
        >
          <Link
            href={`/order/${order.id}`}
            className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-brand-blush/30"
          >
            <div>
              <p className="text-sm font-semibold">{order.id}</p>
              <p className="text-xs text-text-muted">
                {new Date(order.createdAt).toLocaleDateString('en-EG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                · {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {order.status === 'delivered' ? (
                <Badge tone="success">Delivered</Badge>
              ) : null}
              <Badge tone="accent">
                {order.paymentMethod === 'cod'
                  ? 'Cash on delivery'
                  : order.paymentMethod === 'card'
                    ? 'Card'
                    : 'Wallet'}
              </Badge>
              <span className="text-sm font-semibold text-brand-primary">
                {formatEGP(order.total)}
              </span>
            </div>
          </Link>
          {order.status === 'delivered' ? (
            <RateOrderItems items={order.items} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
