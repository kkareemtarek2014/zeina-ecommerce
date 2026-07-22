'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Copy, MessageCircle, Printer } from 'lucide-react';
import {
  AdminPageHeader,
  ORDER_STATUS_LABELS,
  OrderQuickActions,
  OrderStatusSelect,
  SectionCard,
  StatusPill,
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

  const handleCopyAddress = async () => {
    if (!order) return;
    const { fullName, phone, governorate, city, street, notes } = order.address;
    const text = `Customer: ${fullName}\nPhone: ${phone}\nAddress: ${street}, ${city}, ${governorate}\nNotes: ${notes ?? 'None'}`;
    try {
      await navigator.clipboard.writeText(text);
      toast('Shipping address copied to clipboard', 'success');
    } catch {
      toast('Failed to copy address', 'error');
    }
  };

  const getWhatsappUrl = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    const formatted = digits.startsWith('0') ? `2${digits}` : digits;
    return `https://wa.me/${formatted}`;
  };

  return (
    <div>
      <style jsx global>{`
        @media print {
          aside,
          header,
          nav,
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:w-full {
            width: 100% !important;
          }
        }
      `}</style>

      <AdminPageHeader
        title={order ? `Order #${order.id}` : 'Order detail'}
        subtitle={
          order
            ? `Placed on ${new Date(order.createdAt).toLocaleString()} · ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`
            : undefined
        }
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Orders', href: '/admin/orders' },
          { label: order?.id ?? id },
        ]}
        action={
          order ? (
            <div className="flex items-center gap-2 print:hidden">
              <OrderQuickActions
                orderId={order.id}
                status={order.status}
                size="md"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5"
              >
                <Printer className="size-4" />
                <span>Packing slip</span>
              </Button>
            </div>
          ) : undefined
        }
      />

      {isLoading ? (
        <p className="mt-6 text-sm text-text-muted">Loading order details…</p>
      ) : isError || !order ? (
        <p className="mt-6 text-sm text-status-error">Order not found.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Top Status & Advance Controls */}
          <SectionCard className="print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StatusPill status={order.status} />
                <span className="text-xs text-text-muted">
                  Current Status: <strong>{ORDER_STATUS_LABELS[order.status]}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-52">
                  <OrderStatusSelect
                    current={order.status}
                    value={status}
                    onChange={setDraftStatus}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={status === order.status || updateMutation.isPending}
                  isLoading={updateMutation.isPending}
                  onClick={() => {
                    updateMutation.mutate(
                      { status },
                      {
                        onSuccess: () => {
                          toast('Status updated successfully', 'success');
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
                  Apply status
                </Button>
              </div>
            </div>
          </SectionCard>

          {/* Details Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Customer & Shipping Card */}
            <SectionCard title="Customer & Shipping" className="lg:col-span-1">
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between print:hidden">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Fulfilment Info
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleCopyAddress()}
                      className="h-7 text-xs"
                    >
                      <Copy className="size-3" />
                      <span>Copy</span>
                    </Button>
                    <a
                      href={getWhatsappUrl(order.address.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 items-center gap-1 rounded-(--radius) bg-emerald-600 px-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    >
                      <MessageCircle className="size-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-text-primary">
                    {order.address.fullName}
                  </p>
                  <p className="text-text-secondary">{order.address.phone}</p>
                  <p className="text-text-secondary">
                    {order.address.street}, {order.address.city},{' '}
                    <span className="font-semibold text-text-primary">
                      {order.address.governorate}
                    </span>
                  </p>
                  {order.address.notes && (
                    <p className="mt-2 text-xs italic text-text-muted bg-surface p-2.5 rounded border border-border">
                      Note: &quot;{order.address.notes}&quot;
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-border text-xs text-text-muted print:hidden">
                  {order.userId ? (
                    <Link
                      href={`/admin/users/${order.userId}`}
                      className="text-brand-primary hover:underline"
                    >
                      View user account profile &rarr;
                    </Link>
                  ) : (
                    <span>Guest checkout order</span>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Items Card */}
            <SectionCard title="Order Items" className="lg:col-span-2">
              <div className="divide-y divide-border">
                {order.items.map((item) => (
                  <div
                    key={`${item.productId}-${item.name}`}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt=""
                          className="size-12 rounded border border-border object-cover print:hidden"
                        />
                      )}
                      <div>
                        <p className="font-medium text-text-primary text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          Qty: {item.quantity} &times; {formatEGP(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-text-primary text-sm">
                      {formatEGP(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals Summary inside Items card */}
              <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>{formatEGP(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Shipping</span>
                  <span>{order.shipping === 0 ? 'Free' : formatEGP(order.shipping)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-status-success font-medium">
                    <span>Discount ({order.promoCode ?? 'Promo'})</span>
                    <span>-{formatEGP(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 font-bold text-text-primary text-base border-t border-border">
                  <span>Total ({order.paymentMethod.toUpperCase()})</span>
                  <span>{formatEGP(order.total)}</span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Bosta Integration Card */}
          {bostaOn ? (
            <SectionCard title="Bosta Shipment Integration">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                  <p className="text-xs text-text-secondary">
                    Manage fulfilment and courier tracking status via Bosta API.
                  </p>
                  <div className="flex gap-2">
                    {hasShipment ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isLoading={refreshShipment.isPending}
                        disabled={refreshShipment.isPending}
                        onClick={() => {
                          refreshShipment.mutate(undefined, {
                            onSuccess: () => toast('Shipment refreshed', 'success'),
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
                        Sync Bosta Status
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
                              onSuccess: () => toast('Shipment created', 'success'),
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
                        Create Bosta Shipment
                      </Button>
                    )}
                  </div>
                </div>

                {shipmentLoading ? (
                  <p className="text-sm text-text-muted">Loading shipment details…</p>
                ) : hasShipment && shipment ? (
                  <dl className="grid gap-3 text-sm sm:grid-cols-4 bg-surface p-4 rounded border border-border">
                    <div>
                      <dt className="text-xs text-text-muted">Tracking Number</dt>
                      <dd className="font-mono font-medium">
                        {shipment.trackingUrl ? (
                          <a
                            href={shipment.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-primary hover:underline"
                          >
                            {shipment.trackingNumber}
                          </a>
                        ) : (
                          shipment.trackingNumber ?? '—'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-text-muted">Bosta State</dt>
                      <dd className="font-medium text-text-primary">{shipment.bostaState ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-text-muted">Mapped Status</dt>
                      <dd className="font-medium text-text-primary">
                        {shipment.mappedStatus ? ORDER_STATUS_LABELS[shipment.mappedStatus] : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-text-muted">COD Amount</dt>
                      <dd className="font-medium text-text-primary">{formatEGP(shipment.codAmount)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-text-muted">
                    No active Bosta shipment. Create one when ready for dispatch.
                  </p>
                )}
              </div>
            </SectionCard>
          ) : null}

          {/* Timeline History Card */}
          <SectionCard title="Status History & Audit Log" className="print:hidden">
            <OrderStatusTimeline
              currentStatus={order.status}
              timeline={order.timeline}
            />
          </SectionCard>
        </div>
      )}
    </div>
  );
}
