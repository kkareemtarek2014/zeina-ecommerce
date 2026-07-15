import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

/**
 * Shown at /bride when the admin `bridal_page_enabled` toggle is off.
 */
export function BridalComingSoon() {
  return (
    <section className="bg-linear-to-b from-[#fdf8f3] via-brand-blush/60 to-surface">
      <div className="mx-auto flex min-h-[60vh] max-w-container flex-col items-center justify-center gap-6 px-4 py-24 text-center lg:px-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-brand-accent/40 bg-surface-raised px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-brand-accent">
          <Sparkles className="size-3.5" /> Zaya Bridal
        </p>
        <h1 className="max-w-xl font-(family-name:--font-display) text-4xl font-semibold leading-tight lg:text-5xl">
          The Bridal Edit is{' '}
          <span className="italic text-brand-primary">coming soon</span>
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-text-secondary">
          Tiaras, veils, personalized jewelry and luxury gift boxes — we are
          putting the finishing touches on something special. In the meantime,
          explore our everyday collections.
        </p>
        <Link
          href="/shop"
          className="inline-flex h-12 items-center gap-2 rounded-(--radius) bg-brand-primary px-8 text-base font-medium text-text-inverse shadow-sm transition-colors hover:bg-brand-secondary"
        >
          Shop the collection <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
