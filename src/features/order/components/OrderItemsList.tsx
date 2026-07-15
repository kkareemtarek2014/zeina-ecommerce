'use client';

import Image from 'next/image';
import { formatEGP } from '@/shared/utils/price';
import type { OrderDTO } from '@/shared/contracts/order.contract';

export function OrderItemsList({ items }: { items: OrderDTO['items'] }) {
  return (
    <ul className="mt-4 space-y-4 border-b border-border pb-5">
      {items.map((item) => (
        <li key={item.productId} className="flex items-center gap-4">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-(--radius) bg-brand-blush">
            <Image
              src={item.image}
              alt={item.name}
              width={112}
              height={112}
              className="size-full object-cover"
            />
          </div>
          <div className="flex-1 text-sm">
            <p className="line-clamp-1 font-medium">{item.name}</p>
            <p className="text-text-muted">
              Qty {item.quantity}
              {item.isPreorder ? ' · Pre-order' : ''}
            </p>
          </div>
          <span className="text-sm font-medium">
            {formatEGP(item.unitPrice * item.quantity)}
          </span>
        </li>
      ))}
    </ul>
  );
}
