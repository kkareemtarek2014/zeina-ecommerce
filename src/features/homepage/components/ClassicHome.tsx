import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  Gem,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, SITE } from '@/config/site.config';
import { FeaturedProducts } from '@/features/shop';
import { RecentlyViewed } from '@/features/product/components/RecentlyViewed';
import type { Category } from '@/shared/types/product.types';
import { SocialProofSection } from './SocialProofSection';

const VIBES = [
  {
    name: 'Korean Minimal',
    tag: 'Clean lines, tiny pearls, quiet luxury',
    href: '/shop/jewelry',
    className: 'from-brand-blush via-surface-raised to-brand-blush/60',
  },
  {
    name: 'Coquette Era',
    tag: 'Bows, ribbons & soft romantic details',
    href: '/shop/hair',
    className: 'from-brand-primary/15 via-brand-blush to-surface-raised',
  },
  {
    name: 'City Chic',
    tag: 'Statement bags & bold everyday gold',
    href: '/shop/bags',
    className: 'from-brand-accent/20 via-surface-raised to-brand-blush/70',
  },
];

export function ClassicHome({
  categories,
  bridalPage = true,
  bridalSpotlight = true,
}: {
  categories: Category[];
  bridalPage?: boolean;
  /** Homepage bridal section (admin toggle `bridal_show_home_spotlight`). */
  bridalSpotlight?: boolean;
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
              New season · New sparkle
            </p>
            <h1 className="mt-5 font-(family-name:--font-display) text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              Your look, but{' '}
              <span className="italic text-brand-primary">unforgettable</span>.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-text-secondary lg:text-lg">
              {SITE.tagline} Trend-led jewelry, bags, hair pieces and more —
              handpicked for the modern Egyptian woman and delivered to your
              door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex h-13 items-center gap-2 rounded-(--radius) bg-brand-primary px-8 text-base font-semibold text-text-inverse shadow-lg shadow-brand-primary/25 transition-all hover:-translate-y-0.5 hover:bg-brand-secondary hover:shadow-xl hover:shadow-brand-primary/30"
              >
                Shop the collection <ArrowRight className="size-4" />
              </Link>
              {bridalPage ? (
                <Link
                  href="/bride"
                  className="inline-flex h-13 items-center gap-2 rounded-(--radius) border border-brand-accent bg-surface-raised px-8 text-base font-medium text-brand-secondary transition-colors hover:bg-brand-blush"
                >
                  <Gem className="size-4 text-brand-accent" /> The Bridal Edit
                </Link>
              ) : (
                <Link
                  href="/shop/jewelry"
                  className="inline-flex h-13 items-center rounded-(--radius) border border-border-strong bg-surface-raised px-8 text-base font-medium transition-colors hover:border-brand-primary hover:text-brand-primary"
                >
                  Explore jewelry
                </Link>
              )}
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
                piece handpicked
              </span>
            </div>
          </div>

          <div
            className="animate-fade-up stagger relative"
            style={{ '--stagger-i': 2 } as React.CSSProperties}
          >
            <div className="relative aspect-4/3 overflow-hidden rounded-(--radius-lg) shadow-2xl shadow-brand-primary/15">
              <Image
                src="/images/hero.svg"
                alt="Zaya accessories collection"
                title="Zaya accessories collection"
                width={880}
                height={660}
                priority
                className="size-full object-cover"
              />
            </div>
            {/* Floating trend chips */}
            <span className="animate-float absolute -left-3 top-8 rounded-full border border-brand-primary/15 bg-surface-raised px-4 py-2 text-xs font-semibold text-brand-primary shadow-lg lg:-left-6">
              🎀 Coquette Era
            </span>
            <span
              className="animate-float absolute -right-2 bottom-10 rounded-full border border-brand-accent/30 bg-surface-raised px-4 py-2 text-xs font-semibold text-brand-secondary shadow-lg lg:-right-4"
              style={{ animationDelay: '2.5s' }}
            >
              ✨ Korean Minimal
            </span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-container px-4 py-16 lg:px-8">
        <SectionHeading eyebrow="Browse" title="Shop by Category" href="/shop" />
        <div className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              className="group animate-fade-up stagger flex flex-col items-center gap-3"
              style={{ '--stagger-i': i } as React.CSSProperties}
            >
              <div className="aspect-square w-full overflow-hidden rounded-full border-2 border-transparent bg-brand-blush shadow-sm ring-brand-primary/0 transition-all group-hover:border-brand-primary/40 group-hover:shadow-lg group-hover:shadow-brand-primary/15">
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
            title="Curated quality"
            text="Every piece handpicked"
          />
        </div>
      </section>

      {/* Shop the vibe */}
      <section className="mx-auto max-w-container px-4 pb-16 lg:px-8">
        <SectionHeading eyebrow="Trending" title="Shop the Vibe" href="/shop" />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {VIBES.map((vibe, i) => (
            <Link
              key={vibe.name}
              href={vibe.href}
              className={`group animate-fade-up stagger relative flex min-h-52 flex-col justify-end overflow-hidden rounded-(--radius-lg) border border-border bg-linear-to-br p-6 transition-all hover:-translate-y-1 hover:border-brand-primary/40 hover:shadow-xl hover:shadow-brand-primary/10 ${vibe.className}`}
              style={{ '--stagger-i': i } as React.CSSProperties}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-surface-raised/60 blur-xl transition-transform duration-500 group-hover:scale-125"
              />
              <p className="font-(family-name:--font-display) text-2xl font-semibold italic text-text-primary">
                {vibe.name}
              </p>
              <p className="mt-1 text-xs text-text-secondary">{vibe.tag}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
                Shop the vibe{' '}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-container px-4 pb-16 lg:px-8">
        <SectionHeading
          eyebrow="Handpicked"
          title="Featured Pieces"
          href="/shop"
        />
        <div className="mt-8">
          <FeaturedProducts />
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
              <p className="font-(family-name:--font-display) text-xl font-semibold">
                Free shipping over{' '}
                {FREE_SHIPPING_THRESHOLD.toLocaleString()} EGP
              </p>
              <p className="text-sm text-text-secondary">
                Treat yourself — your favourites ship free.
              </p>
            </div>
          </div>
          <Link
            href="/shop"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-(--radius) bg-brand-primary px-6 text-sm font-semibold text-text-inverse shadow-sm transition-colors hover:bg-brand-secondary"
          >
            Start shopping <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Bridal spotlight */}
      {bridalPage && bridalSpotlight && (
        <section className="mx-auto max-w-container px-4 py-16 lg:px-8">
          <div className="grid items-center gap-8 overflow-hidden rounded-(--radius-lg) border border-brand-accent/25 bg-linear-to-br from-[#fdf8f3] via-brand-blush/50 to-surface-raised lg:grid-cols-2">
            <div className="relative order-last aspect-4/3 lg:order-first">
              <Image
                src="/images/bridal-hero.svg"
                alt="Zaya Bridal — tiaras, veils and custom pieces"
                title="Zaya Bridal"
                width={880}
                height={660}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="size-full object-cover"
              />
            </div>
            <div className="px-6 pb-10 pt-2 lg:px-10 lg:py-12">
              <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-brand-accent">
                <Gem className="size-3.5" /> Zaya Bridal
              </p>
              <h2 className="mt-3 font-(family-name:--font-display) text-3xl font-semibold lg:text-4xl">
                Getting married?{' '}
                <span className="italic text-brand-primary">
                  We do the sparkle.
                </span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                Tiaras, veils, bridal jewelry and personalized gift boxes —
                plus fully custom pieces sourced from your inspiration photos,
                with a reply within 2 days.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/bride"
                  className="inline-flex h-12 items-center gap-2 rounded-(--radius) bg-brand-primary px-7 text-sm font-semibold text-text-inverse shadow-sm transition-colors hover:bg-brand-secondary"
                >
                  Explore the Bridal Edit <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/bride/custom"
                  className="inline-flex h-12 items-center rounded-(--radius) border border-brand-accent px-7 text-sm font-medium text-brand-secondary transition-colors hover:bg-brand-blush"
                >
                  Request a custom piece
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <RecentlyViewed className="mx-auto max-w-container px-4 lg:px-8 pb-16" />

      <SocialProofSection />

      {/* Final CTA */}
      <section className="bg-linear-to-r from-brand-secondary via-brand-primary to-brand-secondary">
        <div className="mx-auto flex max-w-container flex-col items-center gap-5 px-4 py-14 text-center lg:px-8">
          <h2 className="max-w-2xl font-(family-name:--font-display) text-3xl font-semibold text-text-inverse lg:text-4xl">
            Ready to sparkle?
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-text-inverse/85">
            New pieces drop every week — find the one that feels like you,
            pay on delivery, and let us handle the rest.
          </p>
          <Link
            href="/shop"
            className="inline-flex h-12 items-center gap-2 rounded-(--radius) bg-surface-raised px-8 text-base font-semibold text-brand-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-blush"
          >
            Shop new arrivals <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <SeoStrip />
    </>
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
        <h2 className="mt-1 font-(family-name:--font-display) text-2xl font-semibold lg:text-3xl">
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

export function SeoStrip() {
  return (
    <section className="border-t border-border bg-brand-blush/30">
      <div className="mx-auto max-w-container px-4 py-14 lg:px-8">
        <h2 className="font-(family-name:--font-display) text-2xl font-semibold">
          Women’s Accessories Online in Egypt
        </h2>
        <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-text-secondary">
          <p>
            {SITE.name} is your ultimate destination for women’s accessories in Egypt. We
            carefully curate premium jewelry, elegant bags, stylish hair accessories, versatile scarves, chic sunglasses, and
            timeless watches — every single piece is handpicked for exceptional quality and modern style, ensuring you don’t
            have to scroll through thousands of options to find the perfect addition to your wardrobe.
          </p>
          <p>
            Discover our extensive collection designed to elevate your everyday look. From statement necklaces that catch the light to practical yet fashionable tote bags for your daily commute, our selection caters to every taste and occasion. We believe that the right accessory can transform any outfit, giving you the confidence to express your unique personality effortlessly.
          </p>
          <p>
            Shopping with us is remarkably simple and secure: browse our collections, add your favorite items to your bag, and choose to pay cash on
            delivery when your order arrives at your doorstep — no credit card required. We proudly deliver
            across all of Egypt, offering fast shipping from Cairo and Giza to every single governorate, along with complimentary free
            shipping on larger orders to make your experience even better.
          </p>
          <p>
            Whether you’re thoughtfully treating yourself to a well-deserved upgrade or searching for the perfect gift for a loved one,{' '}
            {SITE.name} makes it truly effortless to find exquisite pieces you’ll love to wear
            every single day. Join thousands of satisfied customers who have made us their go-to online accessory store.
          </p>
        </div>
      </div>
    </section>
  );
}
