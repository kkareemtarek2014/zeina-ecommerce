import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Banknote, ShieldCheck, Truck } from 'lucide-react';
import { SITE } from '@/config/site.config';
import { FeaturedProducts } from '@/features/shop';
import { RecentlyViewed } from '@/features/product/components/RecentlyViewed';
import type { Category } from '@/shared/types/product.types';
import { SocialProofSection } from './SocialProofSection';

export function ClassicHome({ categories }: { categories: Category[] }) {
  return (
    <>
      <section className="bg-linear-to-br from-brand-blush via-surface to-surface">
        <div className="mx-auto grid max-w-container items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="animate-fade-up max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-brand-accent">
              New season · New sparkle
            </p>
            <h1 className="mt-4 font-(family-name:--font-display) text-4xl font-semibold leading-tight lg:text-6xl">
              {SITE.tagline}
            </h1>
            <p className="mt-5 leading-relaxed text-text-secondary">
              Curated accessories for the modern Egyptian woman — jewelry,
              bags, scarves and more, delivered to your door anywhere in Egypt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center gap-2 rounded-(--radius) bg-brand-primary px-8 text-base font-medium text-text-inverse shadow-sm transition-colors hover:bg-brand-secondary"
              >
                Shop now <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/shop/jewelry"
                className="inline-flex h-12 items-center rounded-(--radius) border border-border-strong px-8 text-base font-medium transition-colors hover:border-brand-primary hover:text-brand-primary"
              >
                Explore jewelry
              </Link>
            </div>
          </div>

          <div
            className="animate-fade-up stagger relative aspect-4/3 overflow-hidden rounded-(--radius-lg) shadow-xl shadow-brand-primary/10"
            style={{ '--stagger-i': 2 } as React.CSSProperties}
          >
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
        </div>
      </section>

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

      <section className="mx-auto max-w-container px-4 py-16 lg:px-8">
        <SectionHeading eyebrow="Browse" title="Shop by Category" href="/shop" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              className="group overflow-hidden rounded-(--radius-lg) border border-border bg-surface-raised transition-shadow hover:shadow-lg hover:shadow-brand-primary/5"
            >
              <div className="aspect-square overflow-hidden bg-brand-blush">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  title={cat.name}
                  width={300}
                  height={300}
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="p-3 text-center text-sm font-medium transition-colors group-hover:text-brand-primary">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-container px-4 pb-8 lg:px-8">
        <SectionHeading
          eyebrow="Handpicked"
          title="Featured Pieces"
          href="/shop"
        />
        <div className="mt-8">
          <FeaturedProducts />
        </div>
      </section>

      <RecentlyViewed className="mx-auto max-w-container px-4 lg:px-8 pb-16" />

      <SocialProofSection />

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
        className="shrink-0 text-sm font-medium text-brand-primary underline-offset-4 hover:underline"
      >
        View all
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
