import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE } from '@/config/site.config';
import { ProductDetails } from '@/features/product';
import {
  getProductMetadataSource,
  getProductOrNull,
} from '@/server/services/product.service';
import type { ProductDTO } from '@/shared/contracts/product.contract';

interface Props {
  params: Promise<{ id: string }>;
}

async function loadProduct(id: string): Promise<ProductDTO | null> {
  try {
    return await getProductOrNull(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductMetadataSource(id);
  if (!product) return { title: 'Product not found' };

  const title = product.seoTitle?.trim() || product.name;
  const description =
    product.seoDescription?.trim() || product.description;
  const canonical =
    product.canonicalUrl?.trim() || `/product/${product.id}`;
  const ogImage =
    product.ogImage?.trim() || product.images[0] || undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title: `${title} · ${SITE.name}`,
      description,
      url: canonical.startsWith('http')
        ? canonical
        : `${SITE.url}${canonical.startsWith('/') ? '' : '/'}${canonical}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    other: {
      'product:price:amount': String(product.price),
      'product:price:currency': SITE.currency,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((src) =>
      src.startsWith('http') ? src : `${SITE.url}${src}`,
    ),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: SITE.currency,
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE.url}/product/${product.id}`,
    },
  };

  return (
    <div className="mx-auto max-w-container px-4 py-10 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetails id={id} />
    </div>
  );
}
