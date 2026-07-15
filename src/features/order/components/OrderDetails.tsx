'use client';

import Link from 'next/link';

import { formatEGP } from '@/shared/utils/price';
import { getGovernorate } from '@/shared/data/governorates.data';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { OrderBodySkeleton } from '@/shared/components/ui';
import { OrderItemsList } from './OrderItemsList';
import { useOrder } from '../hooks/useOrders';
import { OrderStatusTimeline } from './OrderStatusTimeline';

export function OrderDetails({ orderId }: { orderId: string }) {


  const mounted = useHydrated();
  const { data: order, isLoading, isError } = useOrder(orderId);

  if (!mounted || isLoading) {
    return <OrderBodySkeleton />;
  }

  if (isError || !order) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg text-text-secondary">
          We couldn’t find this order.
        </p>
        <Link
          href="/shop"
          className="mt-2 inline-block text-brand-primary underline underline-offset-4"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  const governorate = getGovernorate(order.address.governorate);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">
          Order {order.id}
        </h1>
        <p className="text-text-secondary mt-1">
          Placed on {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface-raised p-6 md:p-8">
        <OrderStatusTimeline
          currentStatus={order.status}
          timeline={order.timeline}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface-raised p-6">
          <h2 className="font-display text-lg font-semibold">
            Order Summary
          </h2>

          <OrderItemsList items={order.items} />


          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Subtotal</dt>
              <dd>{formatEGP(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-status-success">
                <dt>
                  Discount
                  {order.promoCode ? ` (${order.promoCode})` : ''}
                </dt>
                <dd>-{formatEGP(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-text-secondary">Shipping</dt>
              <dd>
                {order.shipping === 0 ? 'Free' : formatEGP(order.shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total (cash on delivery)</dt>
              <dd className="text-brand-primary">{formatEGP(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-8">
          <div className="rounded-lg border border-border bg-surface-raised p-6">
            <h2 className="font-display text-lg font-semibold">
              Shipping Information
            </h2>
            <div className="mt-4 space-y-2 text-sm text-text-secondary">
              <p className="font-medium text-text-primary">
                {order.address.fullName}
              </p>
              <p>{order.address.phone}</p>
              <p>
                {order.address.street}, {order.address.city}
              </p>
              <p>{governorate?.name ?? order.address.governorate}</p>
            </div>
            {order.tracking ? (
              <div className="mt-4 border-t border-border pt-4 text-sm">
                <p className="font-medium text-text-primary">Tracking</p>
                <a
                  href={order.tracking.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-mono text-brand-primary hover:underline"
                >
                  {order.tracking.number}
                </a>
              </div>
            ) : null}
          </div>

          {(order.address.notes || order.note) && (
            <div className="rounded-lg border border-border bg-surface-raised p-6">
              <h2 className="font-display text-lg font-semibold">
                Order Notes
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {order.note || order.address.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
