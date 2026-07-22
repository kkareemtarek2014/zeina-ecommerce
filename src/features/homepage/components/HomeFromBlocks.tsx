'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import {
  ProductGrid,
  useCategories,
  useFeaturedProducts,
  useNewArrivals,
  useProducts,
  getProductById,
} from '@/features/shop';
import { RecentlyViewed } from '@/features/product/components/RecentlyViewed';
import type { HomepageBlockDTO } from '@/shared/contracts/homepage.contract';
import type { Product } from '@/shared/types/product.types';
import {
  resolveVisibleHref,
} from '@/shared/lib/feature-links';
import { SectionHeading, SeoStrip } from './ClassicHome';
import { SocialProofSection } from './SocialProofSection';

function HeroBlock({ config }: { config: Record<string, unknown> }) {
  const title = typeof config.title === 'string' ? config.title : '';
  const subtitle =
    typeof config.subtitle === 'string' ? config.subtitle : undefined;
  const image =
    typeof config.image === 'string' && config.image
      ? config.image
      : '/images/hero.svg';
  const ctaLabel =
    typeof config.ctaLabel === 'string' ? config.ctaLabel : undefined;
  const ctaHref = resolveVisibleHref(
    typeof config.ctaHref === 'string' ? config.ctaHref : undefined,
  );
  const secondaryCtaLabel =
    typeof config.secondaryCtaLabel === 'string'
      ? config.secondaryCtaLabel
      : undefined;
  const secondaryCtaHref = resolveVisibleHref(
    typeof config.secondaryCtaHref === 'string'
      ? config.secondaryCtaHref
      : undefined,
  );

  return (
    <section className="bg-linear-to-br from-brand-blush via-surface to-surface">
      <div className="mx-auto grid max-w-container items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div className="animate-fade-up max-w-xl">
          <h1 className="font-(family-name:--font-display) text-4xl font-semibold leading-tight lg:text-6xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-5 leading-relaxed text-text-secondary">
              {subtitle}
            </p>
          ) : null}
          {(ctaLabel && ctaHref) || (secondaryCtaLabel && secondaryCtaHref) ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {ctaLabel && ctaHref ? (
                <Link
                  href={ctaHref}
                  className="inline-flex h-12 items-center gap-2 rounded-(--radius) bg-brand-primary px-8 text-base font-medium text-text-inverse shadow-sm transition-colors hover:bg-brand-secondary"
                >
                  {ctaLabel} <ArrowRight className="size-4" />
                </Link>
              ) : null}
              {secondaryCtaLabel && secondaryCtaHref ? (
                <Link
                  href={secondaryCtaHref}
                  className="inline-flex h-12 items-center rounded-(--radius) border border-border-strong px-8 text-base font-medium transition-colors hover:border-brand-primary hover:text-brand-primary"
                >
                  {secondaryCtaLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
        <div
          className="animate-fade-up stagger relative aspect-4/3 overflow-hidden rounded-lg shadow-xl shadow-brand-primary/10"
          style={{ '--stagger-i': 2 } as React.CSSProperties}
        >
          <Image
            src={image}
            alt={title || 'Hero'}
            width={880}
            height={660}
            priority
            className="size-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function CategoriesBlock({ config }: { config: Record<string, unknown> }) {
  const title =
    typeof config.title === 'string' && config.title
      ? config.title
      : 'Shop by Category';
  const eyebrow =
    typeof config.eyebrow === 'string' && config.eyebrow
      ? config.eyebrow
      : 'Browse';
  const { data: categories, isLoading } = useCategories();

  if (!isLoading && (categories?.length ?? 0) === 0) return null;

  return (
    <section className="mx-auto max-w-container px-4 py-12 lg:px-8">
      <SectionHeading eyebrow={eyebrow} title={title} href="/shop" />
      <div className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {(categories ?? []).map((cat, i) => (
          <Link
            key={cat.slug}
            href={`/shop/${cat.slug}`}
            className="group animate-fade-up stagger flex flex-col items-center gap-3"
            style={{ '--stagger-i': i } as React.CSSProperties}
          >
            <div className="aspect-square w-full overflow-hidden rounded-full border-2 border-transparent bg-brand-blush shadow-sm transition-all group-hover:border-brand-primary/40 group-hover:shadow-lg group-hover:shadow-brand-primary/15">
              <Image
                src={cat.image}
                alt={cat.name}
                title={cat.name}
                width={300}
                height={300}
                sizes="(min-width: 1024px) 14vw, (min-width: 640px) 25vw, 33vw"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <p className="text-center text-sm font-medium transition-colors group-hover:text-brand-primary">
              {cat.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeaturedByIds({ ids }: { ids: string[] }) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['product', id] as const,
      queryFn: () => getProductById(id),
    })),
  });
  const isLoading = results.some((r) => r.isLoading);
  const products = results
    .map((r) => r.data)
    .filter((p): p is Product => p != null);

  return <ProductGrid products={products} isLoading={isLoading} />;
}

function FeaturedBlock({ config }: { config: Record<string, unknown> }) {
  const title =
    typeof config.title === 'string' && config.title
      ? config.title
      : 'Featured Pieces';
  const ids = Array.isArray(config.productIds)
    ? config.productIds.filter((x): x is string => typeof x === 'string')
    : [];
  const featured = useFeaturedProducts();

  return (
    <section className="mx-auto max-w-container px-4 py-12 lg:px-8">
      <SectionHeading eyebrow="Handpicked" title={title} href="/shop" />
      <div className="mt-8">
        {ids.length > 0 ? (
          <FeaturedByIds ids={ids} />
        ) : (
          <ProductGrid
            products={featured.data}
            isLoading={featured.isLoading}
          />
        )}
      </div>
    </section>
  );
}

function NewArrivalsBlock({ config }: { config: Record<string, unknown> }) {
  const title =
    typeof config.title === 'string' && config.title
      ? config.title
      : 'New arrivals';
  const limit =
    typeof config.limit === 'number' && config.limit > 0 ? config.limit : 8;
  const { data, isLoading } = useNewArrivals(limit);

  return (
    <section className="mx-auto max-w-container px-4 py-12 lg:px-8">
      <SectionHeading eyebrow="Just in" title={title} href="/shop" />
      <div className="mt-8">
        <ProductGrid products={data} isLoading={isLoading} />
      </div>
    </section>
  );
}

function CollectionBlock({ config }: { config: Record<string, unknown> }) {
  const slug =
    typeof config.categorySlug === 'string' ? config.categorySlug : '';
  const title =
    typeof config.title === 'string' && config.title
      ? config.title
      : 'Collection';
  const description =
    typeof config.description === 'string' ? config.description : undefined;
  const { data, isLoading } = useProducts(slug);

  if (!slug) return null;

  return (
    <section className="mx-auto max-w-container px-4 py-12 lg:px-8">
      <SectionHeading
        eyebrow="Collection"
        title={title}
        href={`/shop/${slug}`}
      />
      {description ? (
        <p className="mt-3 max-w-2xl text-sm text-text-secondary">
          {description}
        </p>
      ) : null}
      <div className="mt-8">
        <ProductGrid products={data} isLoading={isLoading} />
      </div>
    </section>
  );
}

function PromoBlock({ config }: { config: Record<string, unknown> }) {
  const title = typeof config.title === 'string' ? config.title : '';
  const body = typeof config.body === 'string' ? config.body : undefined;
  const image =
    typeof config.image === 'string' && config.image
      ? config.image
      : undefined;
  const ctaLabel =
    typeof config.ctaLabel === 'string' ? config.ctaLabel : undefined;
  const ctaHref = resolveVisibleHref(
    typeof config.ctaHref === 'string' ? config.ctaHref : undefined,
  );

  return (
    <section className="border-y border-border bg-brand-blush/40">
      <div className="mx-auto grid max-w-container items-center gap-8 px-4 py-12 lg:grid-cols-2 lg:px-8">
        <div className="animate-fade-up">
          <h2 className="font-(family-name:--font-display) text-3xl font-semibold">
            {title}
          </h2>
          {body ? (
            <p className="mt-3 text-text-secondary">{body}</p>
          ) : null}
          {ctaLabel && ctaHref ? (
            <Link
              href={ctaHref}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-(--radius) bg-brand-primary px-6 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-secondary"
            >
              {ctaLabel} <ArrowRight className="size-4" />
            </Link>
          ) : null}
        </div>
        {image ? (
          <div className="relative aspect-16/10 overflow-hidden rounded-lg">
            <Image
              src={image}
              alt={title}
              width={720}
              height={450}
              className="size-full object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function HomeBlock({ block }: { block: HomepageBlockDTO }) {
  switch (block.type) {
    case 'hero':
      return <HeroBlock config={block.config} />;
    case 'categories':
      return <CategoriesBlock config={block.config} />;
    case 'featured':
      return <FeaturedBlock config={block.config} />;
    case 'new_arrivals':
      return <NewArrivalsBlock config={block.config} />;
    case 'collection':
      return <CollectionBlock config={block.config} />;
    case 'promo':
      return <PromoBlock config={block.config} />;
    default:
      return null;
  }
}

export function HomeFromBlocks({ blocks }: { blocks: HomepageBlockDTO[] }) {
  return (
    <>
      {blocks.map((block) => (
        <HomeBlock key={block.id} block={block} />
      ))}
      <RecentlyViewed className="mx-auto max-w-container px-4 lg:px-8 pb-16" />
      <SocialProofSection />
      <SeoStrip />
    </>
  );
}
