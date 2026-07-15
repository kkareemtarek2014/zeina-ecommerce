import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Gem,
  Gift,
  HeartHandshake,
  MessageCircleHeart,
  PenLine,
  Sparkles,
  Truck,
} from 'lucide-react';

const COLLECTIONS = [
  {
    name: 'Tiaras & Crowns',
    image: '/images/bridal-tiaras.svg',
    text: 'Crystal crowns and pearl tiaras for your walk down the aisle.',
  },
  {
    name: 'Veils & Hair',
    image: '/images/bridal-veils.svg',
    text: 'Veils, combs, pins and hair vines — soft, luminous, unforgettable.',
  },
  {
    name: 'Bridal Jewelry',
    image: '/images/bridal-jewelry.svg',
    text: 'Earrings, necklaces and bracelet sets made to catch the light.',
  },
  {
    name: 'Gift Boxes',
    image: '/images/bridal-boxes.svg',
    text: 'Bridesmaid boxes, welcome boxes and keepsakes they will treasure.',
  },
];

const PERSONALIZATION = [
  'Names & initials',
  'Wedding dates',
  'Custom messages',
  'Special colours',
  'Premium gift wrapping',
  'Personalized gift cards',
];

const TIERS = [
  {
    name: 'Personalized accessories',
    price: '250–600 EGP',
    text: 'Name necklaces, initial bracelets, engraved keepsakes.',
  },
  {
    name: 'Bridal gift boxes',
    price: '600–1,500 EGP',
    text: 'Curated boxes for brides, bridesmaids and engagement parties.',
    featured: true,
  },
  {
    name: 'Premium wedding sets',
    price: '1,500+ EGP',
    text: 'Full bridal sets with luxury packaging, made to order.',
  },
];

export interface BridalLandingProps {
  /** Admin toggles (settings `bridal_show_*`) — every section can be hidden. */
  showCollections?: boolean;
  showPersonalization?: boolean;
  showTiers?: boolean;
  showFinalCta?: boolean;
  /** Custom-request funnel — hides all "custom piece" CTAs when off. */
  customRequests?: boolean;
}

/**
 * /bride — dedicated luxury landing page for the bridal & custom line.
 * Server-safe (no client hooks); page visibility is controlled by the admin
 * `bridal_page_enabled` setting, and each section by `bridal_show_*` toggles.
 */
export function BridalLanding({
  showCollections = true,
  showPersonalization = true,
  showTiers = true,
  showFinalCta = true,
  customRequests = true,
}: BridalLandingProps) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-b from-[#fdf8f3] via-brand-blush/60 to-surface">
        <div className="mx-auto grid max-w-container items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="animate-fade-up max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-accent/40 bg-surface-raised px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-brand-accent">
              <Sparkles className="size-3.5" /> Zaya Bridal
            </p>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight lg:text-6xl">
              Your big day,
              <span className="block italic text-brand-primary">
                perfectly adorned.
              </span>
            </h1>
            <p className="mt-5 leading-relaxed text-text-secondary">
              Tiaras, veils, jewelry and personalized gift boxes — curated and
              custom-made for brides who want their day to feel as special as
              it looks. Luxury packaging, delivered anywhere in Egypt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop/bride"
                className="inline-flex h-12 items-center gap-2 rounded-(--radius) bg-brand-primary px-8 text-base font-medium text-text-inverse shadow-lg shadow-brand-primary/20 transition-colors hover:bg-brand-secondary"
              >
                Shop the bridal collection <ArrowRight className="size-4" />
              </Link>
              {customRequests && (
                <Link
                  href="/bride/custom"
                  className="inline-flex h-12 items-center gap-2 rounded-(--radius) border border-brand-accent bg-surface-raised px-8 text-base font-medium text-brand-secondary transition-colors hover:bg-brand-blush"
                >
                  <PenLine className="size-4" /> Design a custom piece
                </Link>
              )}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Gift className="size-3.5 text-brand-accent" /> Luxury packaging
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="size-3.5 text-brand-accent" /> Egypt-wide delivery
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HeartHandshake className="size-3.5 text-brand-accent" /> Cash on delivery
              </span>
            </div>
          </div>

          <div
            className="animate-fade-up stagger relative aspect-4/3 overflow-hidden rounded-lg border border-brand-accent/20 shadow-2xl shadow-brand-primary/15"
            style={{ '--stagger-i': 2 } as React.CSSProperties}
          >
            <Image
              src="/images/bridal-hero.svg"
              alt="Zaya bridal collection — tiaras, veils and jewelry"
              title="Zaya bridal collection"
              width={880}
              height={660}
              priority
              className="size-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Collections */}
      {showCollections && (
      <section className="mx-auto max-w-container px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-brand-accent">
            The collections
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold lg:text-4xl">
            Everything for the aisle &amp; after
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {COLLECTIONS.map((c, i) => (
            <Link
              key={c.name}
              href="/shop/bride"
              className="group animate-fade-up stagger overflow-hidden rounded-lg border border-border bg-surface-raised transition-all hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-xl hover:shadow-brand-primary/10"
              style={{ '--stagger-i': i } as React.CSSProperties}
            >
              <div className="aspect-square overflow-hidden">
                <Image
                  src={c.image}
                  alt={c.name}
                  title={c.name}
                  width={300}
                  height={300}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="font-display text-lg font-semibold transition-colors group-hover:text-brand-primary">
                  {c.name}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {c.text}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* Personalization */}
      {showPersonalization && (
      <section className="border-y border-brand-accent/20 bg-brand-blush/40">
        <div className="mx-auto grid max-w-container items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-brand-accent">
              Made only for you
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold lg:text-4xl">
              Personalized, engraved, unforgettable
            </h2>
            <p className="mt-4 leading-relaxed text-text-secondary">
              We partner with trusted local artisans and engraving workshops so
              your pieces carry your story — a name necklace for the bride, an
              engraved box for your bridesmaids, a keepsake with your wedding
              date.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
              {PERSONALIZATION.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Gem className="size-3.5 shrink-0 text-brand-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={customRequests ? '/bride/custom' : '/shop/bride'}
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-(--radius) bg-brand-primary px-8 text-base font-medium text-text-inverse shadow-sm transition-colors hover:bg-brand-secondary"
            >
              {customRequests
                ? 'Start your custom order'
                : 'Shop the bridal collection'}{' '}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* How it works — describes the custom-request flow */}
          {customRequests && (
          <ol className="space-y-4">
            {[
              {
                title: 'Share your inspiration',
                text: 'Upload a photo or video of the piece you dream of — or describe it in your own words.',
              },
              {
                title: 'Get options within 2 days',
                text: 'Our team replies with sourcing and customization options, prices and timelines.',
              },
              {
                title: 'Crafted & delivered',
                text: 'Your piece is prepared, wrapped in Zaya luxury packaging and shipped to your door.',
              },
            ].map((step, i) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-lg border border-brand-accent/20 bg-surface-raised p-5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary font-display text-base font-semibold text-text-inverse">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          )}
        </div>
      </section>
      )}

      {/* Price tiers */}
      {showTiers && (
      <section className="mx-auto max-w-container px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-brand-accent">
            For every budget
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold lg:text-4xl">
            From a sweet detail to the full set
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={
                tier.featured
                  ? 'rounded-lg border-2 border-brand-accent bg-surface-raised p-6 text-center shadow-xl shadow-brand-accent/10'
                  : 'rounded-lg border border-border bg-surface-raised p-6 text-center'
              }
            >
              <p className="text-sm font-medium text-text-secondary">
                {tier.name}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-brand-primary">
                {tier.price}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                {tier.text}
              </p>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Final CTA */}
      {showFinalCta && (
      <section className="bg-linear-to-r from-brand-secondary via-brand-primary to-brand-secondary">
        <div className="mx-auto flex max-w-container flex-col items-center gap-6 px-4 py-16 text-center lg:px-8">
          <MessageCircleHeart className="size-8 text-text-inverse/80" />
          <h2 className="max-w-2xl font-display text-3xl font-semibold text-text-inverse lg:text-4xl">
            Planning your wedding? Let&rsquo;s make it sparkle.
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-text-inverse/85">
            {customRequests
              ? 'Send us your inspiration and get options with prices within 2 days — no commitment, just ideas for your big day.'
              : 'Explore tiaras, veils, jewelry and gift boxes curated for your big day — delivered anywhere in Egypt.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {customRequests ? (
              <>
                <Link
                  href="/bride/custom"
                  className="inline-flex h-12 items-center gap-2 rounded-(--radius) bg-surface-raised px-8 text-base font-medium text-brand-primary transition-colors hover:bg-brand-blush"
                >
                  Request a custom piece <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/shop/bride"
                  className="inline-flex h-12 items-center rounded-(--radius) border border-text-inverse/40 px-8 text-base font-medium text-text-inverse transition-colors hover:bg-text-inverse/10"
                >
                  Browse bridal pieces
                </Link>
              </>
            ) : (
              <Link
                href="/shop/bride"
                className="inline-flex h-12 items-center gap-2 rounded-(--radius) bg-surface-raised px-8 text-base font-medium text-brand-primary transition-colors hover:bg-brand-blush"
              >
                Browse bridal pieces <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </section>
      )}
    </>
  );
}
