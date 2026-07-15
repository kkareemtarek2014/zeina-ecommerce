'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { CircleCheck, CircleAlert, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatEGP } from '@/shared/utils/price';
import { getGovernorate } from '@/shared/data/governorates.data';
import { Button, OrderBodySkeleton } from '@/shared/components/ui';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { api } from '@/shared/lib/api-client';
import type { PaymentStatusDTO } from '@/shared/contracts/payment.contract';
import type { PaymobIntentionResult } from '@/shared/contracts/payment.contract';
import { OrderItemsList } from './OrderItemsList';
import { useOrder } from '../hooks/useOrders';



function usePaymentPoll(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['payments', orderId],
    queryFn: () =>
      api.get<PaymentStatusDTO>(
        `/api/payments/${encodeURIComponent(orderId)}`,
      ),
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.paymentStatus;
      if (status === 'paid' || status === 'failed' || status === 'refunded') {
        return false;
      }
      return 2500;
    },
  });
}

export function OrderConfirmation({ orderId }: { orderId: string }) {
  const mounted = useHydrated();
  const { data: order, isLoading, isError, refetch } = useOrder(orderId);
  const needsPoll =
    Boolean(order) &&
    (order?.paymentMethod === 'card' || order?.paymentMethod === 'wallet') &&
    order?.paymentStatus !== 'paid';
  const { data: payment } = usePaymentPoll(orderId, Boolean(needsPoll));

  useEffect(() => {
    if (
      payment &&
      order &&
      payment.paymentStatus !== order.paymentStatus &&
      (payment.paymentStatus === 'paid' || payment.paymentStatus === 'failed')
    ) {
      void refetch();
    }
  }, [payment, order, refetch]);

  const paymentStatus = payment?.paymentStatus ?? order?.paymentStatus;
  const onlinePending =
    (order?.paymentMethod === 'card' || order?.paymentMethod === 'wallet') &&
    paymentStatus === 'pending';
  const onlineFailed =
    (order?.paymentMethod === 'card' || order?.paymentMethod === 'wallet') &&
    paymentStatus === 'failed';
  const onlinePaid =
    order?.paymentMethod === 'cod' ||
    paymentStatus === 'paid' ||
    (order?.paymentMethod !== 'card' && order?.paymentMethod !== 'wallet');

  const retryPayment = async () => {
    const intention = await api.post<PaymobIntentionResult>(
      '/api/payments/paymob/intention',
      { orderId },
    );
    window.location.assign(intention.checkoutUrl);
  };

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
  const totalLabel =
    order.paymentMethod === 'cod'
      ? 'Total (cash on delivery)'
      : order.paymentMethod === 'card'
        ? 'Total (card)'
        : order.paymentMethod === 'wallet'
          ? 'Total (mobile wallet)'
          : 'Total';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center gap-3 text-center">
        {onlinePending ? (
          <Loader2 className="size-14 animate-spin text-brand-primary" />
        ) : onlineFailed ? (
          <CircleAlert className="size-14 text-status-error" />
        ) : (
          <CircleCheck className="size-14 text-status-success" />
        )}
        <h1 className="font-display text-3xl font-semibold">
          {onlinePending
            ? 'Waiting for payment…'
            : onlineFailed
              ? 'Payment unsuccessful'
              : `Thank you, ${order.address.fullName.split(' ')[0]}!`}
        </h1>
        <p className="text-text-secondary">
          {onlinePending ? (
            <>
              Your order <span className="font-medium">{order.id}</span> is
              placed. We’re confirming payment with Paymob — this page updates
              automatically.
            </>
          ) : onlineFailed ? (
            <>
              We couldn’t confirm payment for{' '}
              <span className="font-medium">{order.id}</span>. You can try again
              without re-entering your address.
            </>
          ) : (
            <>
              Your order <span className="font-medium">{order.id}</span> is
              confirmed. We’ll call you on{' '}
              <span className="font-medium">{order.address.phone}</span> to
              arrange delivery.
            </>
          )}
        </p>
        {onlineFailed ? (
          <Button type="button" size="lg" onClick={() => void retryPayment()}>
            Retry payment
          </Button>
        ) : null}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface-raised p-6">
        <h2 className="font-display text-lg font-semibold">Order Summary</h2>

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
            <dt className="text-text-secondary">
              Shipping · {governorate?.name ?? order.address.governorate}
            </dt>
            <dd>
              {order.shipping === 0 ? 'Free' : formatEGP(order.shipping)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
            <dt>{totalLabel}</dt>
            <dd className="text-brand-primary">{formatEGP(order.total)}</dd>
          </div>
          {(order.paymentMethod === 'card' ||
            order.paymentMethod === 'wallet') && (
            <div className="flex justify-between text-xs text-text-muted">
              <dt>Payment status</dt>
              <dd className="capitalize">{paymentStatus ?? 'pending'}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 rounded-(--radius) bg-brand-blush/60 p-4 text-sm text-text-secondary">
          <p className="font-medium text-text-primary">Delivering to</p>
          <p>
            {order.address.street}, {order.address.city},{' '}
            {governorate?.name ?? order.address.governorate}
          </p>
          {order.address.notes && (
            <p className="mt-1 text-xs text-text-muted">
              Note: {order.address.notes}
            </p>
          )}
        </div>

        {order.tracking ? (
          <div className="mt-4 rounded-(--radius) border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Tracking</p>
            <p className="mt-1 text-text-secondary">
              <a
                href={order.tracking.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-brand-primary hover:underline"
              >
                {order.tracking.number}
              </a>
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 text-center">
        <Link href="/shop">
          <Button variant="outline" size="lg" disabled={!onlinePaid && !onlineFailed}>
            Continue shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
