import Link from 'next/link';
import type { AdminOrderDTO } from '@/shared/contracts/admin-ops.contract';
import { ORDER_STATUS_LABELS } from './OrderStatusSelect';
import { formatEGP } from '@/shared/utils/price';

interface RecentOrdersProps {
  orders: AdminOrderDTO[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-text-muted">No orders yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/admin/orders/${encodeURIComponent(order.id)}`}
            className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-brand-primary"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-text-primary">
                {order.id}
              </p>
              <p className="text-xs text-text-muted">
                {ORDER_STATUS_LABELS[order.status]}
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium text-brand-primary">
              {formatEGP(order.total)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
