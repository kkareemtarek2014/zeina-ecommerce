'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  AdminPageHeader,
  ORDER_STATUS_LABELS,
  OrderStatusSelect,
  useAdminOrder,
  useAdminOrderShipment,
  useCreateAdminShipment,
  useRefreshAdminShipment,
  useUpdateAdminOrderStatus,
} from '@/features/admin';
import type { OrderStatus } from '@/shared/contracts/admin-ops.contract';
import { Button, useToast } from '@/shared/components/ui';
import { formatEGP } from '@/shared/utils/price';
import { AppError } from '@/shared/contracts/errors';
import { OrderStatusTimeline } from '@/features/order';
import { isFeatureEnabled } from '@/config/features.config';

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const { data: order, isLoading, isError } = useAdminOrder(id);
  const updateMutation = useUpdateAdminOrderStatus(id);
  const [draftStatus, setDraftStatus] = useState<OrderStatus | null>(null);
  const bostaOn = isFeatureEnabled('bosta_shipping');
  const {
    data: shipment,
    isLoading: shipmentLoading,
    isError: shipmentMissing,
  } = useAdminOrderShipment(id, bostaOn);
  const createShipment = useCreateAdminShipment(id);
  const refreshShipment = useRefreshAdminShipment(id);

  const status = draftStatus ?? order?.status ?? 'placed';
  const hasShipment = Boolean(shipment) && !shipmentMissing;

  return (
    <div>
      <AdminPageHeader
        title="Order detail"
        subtitle={order ? `Order #${order.id} · Created ${new Date(order.createdAt).toLocaleDateString()}` : undefined}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Orders', href: '/admin/orders' },
          { label: order?.id ?? id },
        ]}
      />


      {isLoading ? (
        <p className="mt-6 text-sm text-text-muted">Loading…</p>
      ) : isError || !order ? (
        <p className="mt-6 text-sm text-status-error">Order not found.</p>
      ) : (
        <div className="mt-6 space-y-8">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-56">
              <OrderStatusSelect
                current={order.status}
                value={status}
                onChange={setDraftStatus}
                disabled={updateMutation.isPending}
              />
            </div>
            <Button
              type="button"
              disabled={status === order.status || updateMutation.isPending}
              isLoading={updateMutation.isPending}
              onClick={() => {
                updateMutation.mutate(
                  { status },
                  {
                    onSuccess: () => {
                      toast('Status updated', 'success');
                      setDraftStatus(null);
                    },
                    onError: (err) => {
                      toast(
                        err instanceof AppError
                          ? err.message
                          : 'Update failed',
                        'error',
                      );
                    },
                  },
                );
              }}
            >
              Update status
            </Button>
          </div>

          <OrderStatusTimeline
            currentStatus={order.status}
            timeline={order.timeline}
          />

          {bostaOn ? (
            <section className="space-y-3 rounded-(--radius-lg) border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-medium text-text-primary">
                  Bosta shipment
                </h2>
                <div className="flex flex-wrap gap-2">
                  {hasShipment ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isLoading={refreshShipment.isPending}
                      disabled={refreshShipment.isPending}
                      onClick={() => {
                        refreshShipment.mutate(undefined, {
                          onSuccess: () =>
                            toast('Shipment refreshed', 'success'),
                          onError: (err) =>
                            toast(
                              err instanceof AppError
                                ? err.message
                                : 'Refresh failed',
                              'error',
                            ),
                        });
                      }}
                    >
                      Refresh from Bosta
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      isLoading={createShipment.isPending}
                      disabled={createShipment.isPending || shipmentLoading}
                      onClick={() => {
                        createShipment.mutate(
                          {},
                          {
                            onSuccess: () =>
                              toast('Shipment created', 'success'),
                            onError: (err) =>
                              toast(
                                err instanceof AppError
                                  ? err.message
                                  : 'Create failed',
                                'error',
                              ),
                          },
                        );
                      }}
                    >
                      Create Bosta shipment
                    </Button>
                  )}
                </div>
              </div>
              {shipmentLoading ? (
                <p className="text-sm text-text-muted">Loading shipment…</p>
              ) : hasShipment && shipment ? (
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-text-muted">Tracking</dt>
                    <dd>
                      {shipment.trackingUrl && shipment.trackingNumber ? (
                        <a
                          href={shipment.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-brand-primary hover:underline"
                        >
                          {shipment.trackingNumber}
                        </a>
                      ) : (
                        <span className="font-mono">
                          {shipment.trackingNumber ?? '—'}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Bosta state</dt>
                    <dd>{shipment.bostaState ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Mapped status</dt>
                    <dd>
                      {shipment.mappedStatus
                        ? ORDER_STATUS_LABELS[shipment.mappedStatus]
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">COD amount</dt>
                    <dd>{formatEGP(shipment.codAmount)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-text-muted">
                  No shipment yet. Create one after the order is ready to
                  fulfil, or wait for auto-create on COD / paid card.
                </p>
              )}
            </section>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-2 text-sm">
              <h2 className="font-medium text-text-primary">Customer</h2>
              <p>{order.address.fullName}</p>
              <p className="text-text-secondary">{order.address.phone}</p>
              <p className="text-text-secondary">
                {order.address.street}, {order.address.city},{' '}
                {order.address.governorate}
              </p>
              {order.address.notes ? (
                <p className="text-text-muted">Note: {order.address.notes}</p>
              ) : null}
              {order.userId ? (
                <p>
                  <Link
                    href={`/admin/users/${order.userId}`}
                    className="text-brand-primary hover:underline"
                  >
                    View account
                  </Link>
                </p>
              ) : (
                <p className="text-text-muted">Guest checkout</p>
              )}
            </section>

            <section className="space-y-2 text-sm">
              <h2 className="font-medium text-text-primary">Totals</h2>
              <dl className="space-y-1 text-text-secondary">
                <div className="flex justify-between gap-4">
                  <dt>Subtotal</dt>
                  <dd>{formatEGP(order.subtotal)}</dd>
                </div>
                {order.discount > 0 ? (
                  <div className="flex justify-between gap-4">
                    <dt>Discount</dt>
                    <dd>-{formatEGP(order.discount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt>Shipping</dt>
                  <dd>
                    {order.shipping === 0 ? 'Free' : formatEGP(order.shipping)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 font-medium text-text-primary">
                  <dt>Total</dt>
                  <dd>{formatEGP(order.total)}</dd>
                </div>
              </dl>
              <p className="pt-2 text-xs uppercase tracking-wide text-text-muted">
                {order.paymentMethod} · {order.paymentStatus} ·{' '}
                {ORDER_STATUS_LABELS[order.status]}
              </p>
              {order.promoCode ? (
                <p className="text-xs text-text-muted">
                  Promo: {order.promoCode}
                </p>
              ) : null}
              {order.note ? (
                <p className="text-xs text-text-muted">Order note: {order.note}</p>
              ) : null}
            </section>
          </div>

          <section>
            <h2 className="mb-3 font-medium text-text-primary">Items</h2>
            <ul className="divide-y divide-border rounded-(--radius-lg) border border-border">
              {order.items.map((item) => (
                <li
                  key={`${item.productId}-${item.name}`}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="size-12 shrink-0 overflow-hidden rounded-(--radius) bg-brand-blush/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt=""
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-xs text-text-muted">
                      ×{item.quantity} · {formatEGP(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatEGP(item.unitPrice * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
