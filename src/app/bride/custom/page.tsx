import type { Metadata } from 'next';
import { SITE } from '@/config/site.config';
import { BridalComingSoon, BridalRequestForm } from '@/features/bridal-custom';
import { getBridalPageConfig } from '@/server/services/settings.service';

const description =
  'Want a custom bridal accessory in Egypt? Send us a photo or video of your dream piece — veil, hair vine or jewelry — and our team replies within 2 days with options and prices.';

export const metadata: Metadata = {
  title: 'Custom Bridal Accessories',
  description,
  alternates: { canonical: '/bride/custom' },
  openGraph: {
    title: `Custom Bridal Accessories · ${SITE.name}`,
    description,
    url: `${SITE.url}/bride/custom`,
  },
};

// Admin toggles must apply at request time.
export const dynamic = 'force-dynamic';

export default async function BridalCustomPage() {
  let visible = true;
  try {
    const config = await getBridalPageConfig();
    visible = config.enabled && config.customRequests;
  } catch {
    // Build/preview without DB bindings — default to visible.
  }

  if (!visible) {
    return <BridalComingSoon />;
  }

  return (
    <div className="mx-auto max-w-container px-4 py-12 lg:px-8">
      <div className="mx-auto mb-10 max-w-lg text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-accent">
          For the bride
        </p>
        <h1 className="mt-2 font-(family-name:--font-display) text-3xl font-semibold lg:text-4xl">
          Your Dream Piece, Custom-Sourced
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          Saw a veil, hair vine or jewelry set you love? Upload a photo or
          video and describe it — we’ll find it for you and reply within{' '}
          <strong>2 days maximum</strong> with options and prices.
        </p>
      </div>
      <BridalRequestForm />
    </div>
  );
}
