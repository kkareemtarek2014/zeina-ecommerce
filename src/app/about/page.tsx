import { Metadata } from 'next';
import { SITE } from '@/config/site.config';

export const metadata: Metadata = {
  title: `About Zaya | Premium Women's Accessories in Egypt`,
  description:
    'Discover the story behind Zaya. We bring you curated collections of elegant jewelry, bags, scarves, and accessories across Egypt with cash on delivery.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: `About Zaya | Premium Women's Accessories in Egypt`,
    description:
      'Discover the story behind Zaya. We bring you curated collections of elegant jewelry, bags, scarves, and accessories across Egypt with cash on delivery.',
    url: `${SITE.url}/about`,
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center animate-fade-up">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-accent">
          Our Story
        </p>
        <h1 className="mt-2 font-(family-name:--font-display) text-4xl font-semibold text-text-primary sm:text-5xl">
          About Zaya
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary leading-relaxed">
          Zaya was born from a simple belief: every woman deserves to feel confident, elegant, and perfectly styled. We meticulously curate premium accessories to elevate your everyday look.
        </p>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-8 items-center animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="relative aspect-square overflow-hidden rounded-(--radius-lg) bg-brand-blush">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-brand-primary/40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="size-32">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="mt-4 font-(family-name:--font-display) text-2xl font-bold tracking-widest text-brand-primary/40">Zaya</span>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="font-(family-name:--font-display) text-2xl font-medium text-brand-primary">
              Curated with Love
            </h2>
            <p className="mt-3 text-text-secondary leading-relaxed">
              Based in the heart of Egypt, our team works tirelessly to source the finest jewelry, elegant bags, stylish scarves, and contemporary sunglasses. Every piece in our collection is selected with a focus on quality, durability, and timeless style.
            </p>
          </section>

          <section>
            <h2 className="font-(family-name:--font-display) text-2xl font-medium text-brand-primary">
              The Zaya Promise
            </h2>
            <p className="mt-3 text-text-secondary leading-relaxed">
              We understand that shopping online for accessories requires trust. That's why we offer a seamless shopping experience with cash on delivery across all governorates in Egypt. Our customer service team is always ready to ensure you are 100% satisfied with your purchase.
            </p>
          </section>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
            <div>
              <p className="text-3xl font-bold text-brand-primary">100+</p>
              <p className="mt-1 text-sm font-medium text-text-muted">Unique Styles</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-primary">Egypt</p>
              <p className="mt-1 text-sm font-medium text-text-muted">Nationwide Delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
