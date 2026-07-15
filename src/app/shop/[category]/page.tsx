import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { SITE } from '@/config/site.config';
import { CATEGORIES } from '@/shared/data/categories.data';
import { ShopView } from '@/features/shop/components/ShopView';
import { ShopPageSkeleton } from '@/shared/components/ui';
import {
  getCategoryOrNull,
  listCategories,
} from '@/server/services/product.service';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  try {
    const cats = await listCategories();
    return cats.map((cat) => ({ category: cat.slug }));
  } catch {
    // Build-time without Workers bindings — fall back to seed slugs.
    return CATEGORIES.map((cat) => ({ category: cat.slug }));
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  let match = null as Awaited<ReturnType<typeof getCategoryOrNull>>;
  try {
    match = await getCategoryOrNull(category);
  } catch {
    match = null;
  }
  match ??= CATEGORIES.find((c) => c.slug === category) ?? null;
  if (!match) return { title: 'Shop' };

  const title = `${match.name} for Women in Egypt`;
  return {
    title,
    description: match.seoDescription,
    alternates: { canonical: `/shop/${match.slug}` },
    openGraph: {
      title: `${title} · ${SITE.name}`,
      description: match.seoDescription,
      url: `${SITE.url}/shop/${match.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  let match = null as Awaited<ReturnType<typeof getCategoryOrNull>>;
  try {
    match = await getCategoryOrNull(category);
  } catch {
    match = null;
  }
  match ??= CATEGORIES.find((c) => c.slug === category) ?? null;
  if (!match) notFound();

  return (
    <Suspense fallback={<ShopPageSkeleton />}>
      <ShopView category={category} />
    </Suspense>
  );
}
