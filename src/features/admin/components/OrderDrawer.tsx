'use client';

import Link from 'next/link';
import { Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { Drawer, Button, useToast } from '@/shared/components/ui';
import { useAdminOrder } from '../hooks/useAdminOps';
import { StatusPill } from './ui/StatusPill';
import { OrderQuickActions } from './OrderQuickActions';

export interface OrderDrawerProps {
  orderId: string | null;
  onClose: () => void;
}

export function OrderDrawer({ orderId, onClose }: OrderDrawerProps) {
  const { toast } = useToast();
  const { data: order, isLoading } = useAdminOrder(orderId ?? '');

  const formatEgp = (amount: number) =>
    new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(amount);

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
    <Drawer
      isOpen={Boolean(orderId)}
      onClose={onClose}
      title={orderId ? `Order #${orderId}` : 'Order details'}
    >
      {!orderId ? null : isLoading ? (
        <div className="py-12 text-center text-sm text-text-muted">
          Loading order details…
        </div>
      ) : !order ? (
        <div className="py-12 text-center text-sm text-status-error">
          Failed to load order information.
        </div>
      ) : (
        <div className="space-y-6 text-sm">
          {/* Header & Quick Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <StatusPill status={order.status} />
              <p className="mt-1.5 text-xs text-text-muted">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <OrderQuickActions orderId={order.id} status={order.status} size="sm" />
              <Link
                href={`/admin/orders/${order.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 rounded-(--radius) border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                <span>Full view</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>

          {/* Customer & Address */}
          <div className="rounded-(--radius) border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary">
                Customer & Shipping
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
                  className="inline-flex h-7 items-center gap-1 rounded-(--radius) bg-emerald-600 px-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                >
                  <MessageCircle className="size-3" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="text-text-secondary space-y-1">
              <p className="font-medium text-text-primary">
                {order.address.fullName}
              </p>
              <p>{order.address.phone}</p>
              <p>
                {order.address.street}, {order.address.city},{' '}
                <span className="font-medium text-text-primary">
                  {order.address.governorate}
                </span>
              </p>
              {order.address.notes && (
                <p className="mt-1 text-xs italic text-text-muted">
                  Note: &quot;{order.address.notes}&quot;
                </p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">Items</h3>
            <div className="divide-y divide-border rounded-(--radius) border border-border bg-surface">
              {order.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-10 rounded border border-border object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-text-primary text-xs">
                        {item.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        Qty: {item.quantity} &times; {formatEgp(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-text-primary text-xs">
                    {formatEgp(item.quantity * item.unitPrice)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="rounded-(--radius) border border-border bg-surface p-4 space-y-2">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Subtotal</span>
              <span>{formatEgp(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Shipping</span>
              <span>{formatEgp(order.shipping)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-xs text-status-success">
                <span>Discount ({order.promoCode ?? 'Promo'})</span>
                <span>-{formatEgp(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border font-semibold text-text-primary">
              <span>Total ({order.paymentMethod.toUpperCase()})</span>
              <span>{formatEgp(order.total)}</span>
            </div>
          </div>

          {/* Timeline History */}
          {order.timeline && order.timeline.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-semibold text-text-primary">Timeline</h3>
              <div className="space-y-2 border-l-2 border-border pl-3">
                {order.timeline.map((entry) => (
                  <div key={entry.id} className="text-xs space-y-0.5">
                    <p className="font-medium text-text-primary">
                      Status changed to &quot;{entry.toStatus}&quot; by {entry.actor}
                    </p>
                    <p className="text-text-muted">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
