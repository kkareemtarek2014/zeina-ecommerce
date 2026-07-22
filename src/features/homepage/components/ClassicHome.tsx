import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, SITE } from '@/config/site.config';
import { FeaturedProducts } from '@/features/shop';
import { RecentlyViewed } from '@/features/product/components/RecentlyViewed';
import { WelcomeOfferStrip } from '@/features/welcome-offer';
import { formatEGP } from '@/shared/utils/price';
import type { Category } from '@/shared/types/product.types';
import type { BundleSpotlightDTO } from '@/server/services/bundle.service';
import { SocialProofSection } from './SocialProofSection';
import { RatingStrip } from './RatingStrip';
import { BundleSpotlight } from './BundleSpotlight';

const VIBES = [
  {
    name: 'Pocket Calm',
    slug: 'small',
    tag: 'Tiny squishies that go anywhere — bag, desk, pocket',
    href: '/shop/small',
    className: 'from-brand-blush via-surface-raised to-brand-blush/60',
  },
  {
    name: 'Desk Companion',
    slug: 'medium',
    tag: 'Hand-size stress relief for your daily squeeze',
    href: '/shop/medium',
    className: 'from-brand-primary/15 via-brand-blush to-surface-raised',
  },
  {
    name: 'The Big Squeeze',
    slug: 'large',
    tag: 'Jumbo slow-rising squishies — gifts & bedtime wind-down',
    href: '/shop/large',
    className: 'from-brand-accent/20 via-surface-raised to-brand-blush/70',
  },
];

function PriceChip({ price }: { price?: number }) {
  if (price == null) return null;
  return (
    <span className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-semibold text-brand-primary shadow-sm">
      From {formatEGP(price)}
    </span>
  );
}

export function ClassicHome({
  categories,
  categoryMinPrices = {},
  freeShippingThreshold = FREE_SHIPPING_THRESHOLD,
  bundleSpotlight = null,
  rating = { average: 0, count: 0 },
  whatsappDigits = null,
}: {
  categories: Category[];
  categoryMinPrices?: Record<string, number>;
  freeShippingThreshold?: number;
  bundleSpotlight?: BundleSpotlightDTO | null;
  rating?: { average: number; count: number };
  whatsappDigits?: string | null;
}) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-brand-blush via-surface to-surface">
        {/* Decorative blobs — CSS only */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/4 size-80 rounded-full bg-brand-accent/15 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-container items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="animate-fade-up max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-surface-raised px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-brand-primary shadow-sm">
              <Sparkles className="size-3.5 text-brand-accent" />
              New drop · New squish
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              Squeeze the{' '}
              <span className="italic text-brand-primary">stress away</span>.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-text-secondary lg:text-lg">
              Slow-rising squishy toys that give restless hands something calm
              to do. A few slow squeezes releases the tension of the day and
              brings your mind back to now — one toy, three sizes, delivered
              anywhere in Egypt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex h-13 items-center gap-2 rounded-lg bg-brand-primary px-8 text-base font-semibold text-text-inverse shadow-lg shadow-brand-primary/25 transition-all hover:-translate-y-0.5 hover:bg-brand-secondary hover:shadow-xl hover:shadow-brand-primary/30"
              >
                Shop new drop <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/shop?sort=best-selling"
                className="inline-flex h-13 items-center rounded-lg border border-border-strong bg-surface-raised px-8 text-base font-medium transition-colors hover:border-brand-primary hover:text-brand-primary"
              >
                Best squishies
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Banknote className="size-3.5 text-brand-primary" /> COD
                available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="size-3.5 text-brand-primary" /> Ships all
                over Egypt
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-brand-primary" /> Every
                squish quality-tested
              </span>
            </div>
          </div>

          <div
            className="animate-fade-up stagger relative"
            style={{ '--stagger-i': 2 } as React.CSSProperties}
          >
            <div className="relative aspect-4/3 overflow-hidden rounded-lg shadow-2xl shadow-brand-primary/15">
              <Image
                src="/images/hero.svg"
                alt="Sqoosh squishy stress toys collection"
                title="Sqoosh squishy stress toys"
                width={880}
                height={660}
                priority
                className="size-full object-cover"
              />
            </div>
            {/* Floating trend chips */}
            <span className="animate-float absolute -left-3 top-8 rounded-full border border-brand-primary/15 bg-surface-raised px-4 py-2 text-xs font-semibold text-brand-primary shadow-lg lg:-left-6">
              🌙 Glow Collection
            </span>
            <span
              className="animate-float absolute -right-2 bottom-10 rounded-full border border-brand-accent/30 bg-surface-raised px-4 py-2 text-xs font-semibold text-brand-secondary shadow-lg lg:-right-4"
              style={{ animationDelay: '2.5s' }}
            >
              🍡 Slow Rising
            </span>
          </div>
        </div>
      </section>

      {/* First-order offer — confirms the ad's promise instantly */}
      <WelcomeOfferStrip />

      {/* Best sellers — right under the hero, one tap from purchase intent */}
      <section className="mx-auto max-w-container px-4 py-16 lg:px-8">
        <SectionHeading
          eyebrow="Fan favourites"
          title="Best Squishies"
          href="/shop"
        />
        <div className="mt-8">
          <FeaturedProducts />
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-container px-4 pb-16 lg:px-8">
        <SectionHeading eyebrow="Browse" title="Shop by Size" href="/shop" />
        <div className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              className="group animate-fade-up stagger flex flex-col items-center gap-3"
              style={{ '--stagger-i': i } as React.CSSProperties}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-full border-2 border-transparent bg-brand-blush shadow-sm ring-brand-primary/0 transition-all group-hover:border-brand-primary/40 group-hover:shadow-lg group-hover:shadow-brand-primary/15">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  title={cat.name}
                  width={300}
                  height={300}
                  sizes="(min-width: 1024px) 33vw, 33vw"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <p className="text-center text-sm font-medium transition-colors group-hover:text-brand-primary">
                {cat.name}
              </p>
              <PriceChip price={categoryMinPrices[cat.slug]} />
            </Link>
          ))}
        </div>
      </section>

      {/* Mystery Box / bundle spotlight — highest-AOV moment */}
      {bundleSpotlight ? <BundleSpotlight bundle={bundleSpotlight} /> : null}

      {/* Trust band */}
      <section className="border-y border-border bg-surface-raised">
        <div className="mx-auto grid max-w-container gap-6 px-4 py-6 sm:grid-cols-3 lg:px-8">
          <TrustItem
            icon={<Truck className="size-5" />}
            title="Egypt-wide delivery"
            text="From 50 EGP in Cairo & Giza"
          />
          <TrustItem
            icon={<Banknote className="size-5" />}
            title="Cash on delivery"
            text="Pay when it arrives"
          />
          <TrustItem
            icon={<ShieldCheck className="size-5" />}
            title="Squish-tested quality"
            text="Every batch quality checked"
          />
        </div>
      </section>

      {/* Why squishing works — calm education band */}
      <section className="mx-auto max-w-container px-4 py-16 lg:px-8">
        <SectionHeading
          eyebrow="The science of squish"
          title="Why Squeezing Calms You Down"
          href="/shop"
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <CalmCard
            step="01 · Press"
            title="Give stress somewhere to go"
            text="Squeezing gives nervous energy a physical outlet. Instead of tense shoulders and a clenched jaw, the tension flows into something soft — and out of you."
          />
          <CalmCard
            step="02 · Breathe"
            title="Sync your breath with the rise"
            text="Press in as you breathe in, release as it slowly rises back. This simple rhythm nudges your body from fight-or-flight into rest-and-digest mode."
          />
          <CalmCard
            step="03 · Release"
            title="Come back to the present"
            text="The soft, grounding feel in your hand pulls your attention out of racing thoughts and back to right now — a tiny mindfulness break, no app required."
          />
        </div>
        <p className="mt-6 text-xs leading-relaxed text-text-muted">
          A soft little helper for everyday stress and restless hands — squishies
          support your calm routine, they don&apos;t replace professional care
          when you need it.
        </p>
      </section>

      {/* Shop the vibe */}
      <section className="mx-auto max-w-container px-4 pb-16 lg:px-8">
        <SectionHeading eyebrow="Find your fit" title="Shop by Vibe" href="/shop" />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {VIBES.map((vibe, i) => (
            <Link
              key={vibe.name}
              href={vibe.href}
              className={`group animate-fade-up stagger relative flex min-h-52 flex-col justify-end overflow-hidden rounded-lg border border-border bg-linear-to-br p-6 transition-all hover:-translate-y-1 hover:border-brand-primary/40 hover:shadow-xl hover:shadow-brand-primary/10 ${vibe.className}`}
              style={{ '--stagger-i': i } as React.CSSProperties}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-surface-raised/60 blur-xl transition-transform duration-500 group-hover:scale-125"
              />
              {categoryMinPrices[vibe.slug] != null ? (
                <span className="absolute left-6 top-6">
                  <PriceChip price={categoryMinPrices[vibe.slug]} />
                </span>
              ) : null}
              <p className="font-display text-2xl font-semibold italic text-text-primary">
                {vibe.name}
              </p>
              <p className="mt-1 text-xs text-text-secondary">{vibe.tag}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
                Shop now{' '}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Free shipping promo band */}
      <section className="bg-linear-to-r from-brand-accent/15 via-brand-blush to-brand-accent/15">
        <div className="mx-auto flex max-w-container flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:text-left lg:px-8">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-text-inverse shadow-md">
              <Truck className="size-6" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold">
                Free shipping over{' '}
                {freeShippingThreshold.toLocaleString()} EGP
              </p>
              <p className="text-sm text-text-secondary">
                Treat yourself — your squishies ship free.
              </p>
            </div>
          </div>
          <Link
            href="/shop"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand-primary px-6 text-sm font-semibold text-text-inverse shadow-sm transition-colors hover:bg-brand-secondary"
          >
            Start shopping <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <RecentlyViewed className="mx-auto max-w-container px-4 lg:px-8 pb-8" />

      <RatingStrip average={rating.average} count={rating.count} />

      <div className="pb-8" />

      <SocialProofSection />

      {/* Final CTA */}
      <section className="bg-linear-to-r from-brand-secondary via-brand-primary to-brand-secondary">
        <div className="mx-auto flex max-w-container flex-col items-center gap-5 px-4 py-14 text-center lg:px-8">
          <h2 className="max-w-2xl font-display text-3xl font-semibold text-text-inverse lg:text-4xl">
            Ready to sqoosh?
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-text-inverse/85">
            New squishies drop every month — find your perfect stress companion,
            pay on delivery, and let us handle the rest.
          </p>
          <Link
            href="/shop"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-surface-raised px-8 text-base font-semibold text-brand-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-blush"
          >
            Shop new arrivals <ArrowRight className="size-4" />
          </Link>
          {whatsappDigits ? (
            <a
              href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                'Hi! I need help picking a gift 🎁',
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-text-inverse/85 underline-offset-4 hover:text-text-inverse hover:underline"
            >
              <MessageCircle className="size-4" /> Need a gift? Chat with us
            </a>
          ) : null}
        </div>
      </section>

      <SeoStrip freeShippingThreshold={freeShippingThreshold} />
    </>
  );
}

function CalmCard({
  step,
  title,
  text,
}: {
  step: string;
  title: string;
  text: string;
}) {
  return (
    <div className="animate-fade-up rounded-lg border border-border bg-surface-raised p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-accent">
        {step}
      </p>
      <p className="mt-2 font-display text-lg font-semibold">
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p>
    </div>
  );
}

export function TrustItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-blush text-brand-primary">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-text-muted">{text}</p>
      </div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  href,
}: {
  eyebrow: string;
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-accent">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold lg:text-3xl">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border-strong px-4 py-2 text-sm font-medium transition-colors hover:border-brand-primary hover:text-brand-primary"
      >
        View all <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

export function SeoStrip({
  freeShippingThreshold = FREE_SHIPPING_THRESHOLD,
}: {
  freeShippingThreshold?: number;
} = {}) {
  return (
    <section className="border-t border-border bg-brand-blush/30">
      <div className="mx-auto max-w-container px-4 py-14 lg:px-8">
        <h2 className="font-display text-2xl font-semibold">
          Squishy Stress Toys Online in Egypt
        </h2>
        <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-text-secondary">
          <p>
            {SITE.name} is Egypt&apos;s calm brand — squishy stress toys in three sizes (small, medium &amp; jumbo)
            designed to help you unwind, focus, and breathe. Every squishy is slow-rising, satisfyingly soft, and
            quality-tested before it reaches your hands. Whether you need a pocket squeeze for exam season or a jumbo
            bedside companion to wind down with, we&apos;ve got your calm covered.
          </p>
          <p>
            Our collection features glow-in-the-dark squishies, food-shaped stress toys, adorable animal squishies,
            and themed drops that change every month. Bundle packs and mystery boxes make the perfect gift — or the
            perfect excuse to start a collection.
          </p>
          <p>
            Shopping is simple: browse our collection, add to bag, and pay cash on delivery when your order arrives
            at your doorstep — no credit card needed. We deliver across all of Egypt, from Cairo and Giza to every
            governorate, with free shipping on orders over {freeShippingThreshold} EGP.
          </p>
          <p>
            Whether you&apos;re treating yourself after a long day, shopping for a birthday gift, or building your
            sqoosh collection — {SITE.name} makes it easy to find your next favourite squeeze.
          </p>
        </div>
      </div>
    </section>
  );
}

