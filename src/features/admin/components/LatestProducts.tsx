import Link from 'next/link';
import type { AdminProductDTO } from '@/shared/contracts/admin-catalog.contract';
import { formatEGP } from '@/shared/utils/price';

interface LatestProductsProps {
  products: AdminProductDTO[];
}

export function LatestProducts({ products }: LatestProductsProps) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-text-muted">No products yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {products.map((product) => (
        <li key={product.id}>
          <Link
            href={`/admin/products/${encodeURIComponent(product.id)}/edit`}
            className="flex items-center gap-3 py-3 transition-colors hover:text-brand-primary"
          >
            <div className="size-10 shrink-0 overflow-hidden rounded-(--radius) bg-brand-blush/40">
              {product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0]}
                  alt=""
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text-primary">
                {product.name}
              </p>
              <p className="text-xs text-text-muted">{product.category}</p>
            </div>
            <p className="shrink-0 text-sm font-medium text-brand-primary">
              {formatEGP(product.price)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
