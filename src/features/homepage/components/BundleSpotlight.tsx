import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Gift } from 'lucide-react';
import { formatEGP } from '@/shared/utils/price';
import type { BundleSpotlightDTO } from '@/server/services/bundle.service';

/**
 * Premium homepage moment for the highest-AOV lever (bundles) — a mystery-box
 * style spotlight. Renders nothing when no bundle is active (server decides).
 */
export function BundleSpotlight({
  bundle,
}: {
  bundle: BundleSpotlightDTO;
}) {
  return (
    <section className="mx-auto max-w-container px-4 pb-16 lg:px-8">
      <div className="animate-fade-up relative overflow-hidden rounded-(--radius-lg) border border-brand-accent/25 bg-linear-to-br from-brand-accent/15 via-surface-raised to-brand-blush">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand-accent/20 blur-3xl"
        />
        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
          <div className="relative order-2 mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-(--radius-lg) shadow-xl shadow-brand-accent/15 lg:order-1">
            <Image
              src={bundle.image}
              alt={bundle.name}
              width={480}
              height={480}
              className="size-full object-cover"
            />
          </div>
          <div className="order-1 lg:order-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-text-inverse">
              <Gift className="size-3.5" /> Limited bundle
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold italic text-text-primary lg:text-4xl">
              {bundle.name}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              What&apos;s inside: {bundle.itemCount} surprise squishies, pre-packed
              per batch — zero customization, all squish. The perfect gift or the
              perfect excuse to start a collection.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {bundle.price != null ? (
                <>
                  <span className="font-display text-2xl font-bold text-brand-primary">
                    {formatEGP(bundle.price)}
                  </span>
                  {bundle.compareAtPrice ? (
                    <span className="text-sm text-text-muted line-through">
                      {formatEGP(bundle.compareAtPrice)}
                    </span>
                  ) : null}
                </>
              ) : null}
              {bundle.savingsEgp ? (
                <span className="rounded-full bg-status-success/15 px-2.5 py-1 text-xs font-semibold text-status-success">
                  Save {formatEGP(bundle.savingsEgp)}
                </span>
              ) : null}
            </div>
            <Link
              href="/bundles"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-lg bg-brand-primary px-8 text-base font-semibold text-text-inverse shadow-lg shadow-brand-primary/20 transition-all hover:-translate-y-0.5 hover:bg-brand-secondary"
            >
              Get the mystery box <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
