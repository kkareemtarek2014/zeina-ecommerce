import type { Metadata } from 'next';
import { SITE } from '@/config/site.config';
import { BridalComingSoon, BridalLanding } from '@/features/bridal-custom';
import {
  getBridalPageConfig,
  type BridalPageConfig,
} from '@/server/services/settings.service';

const description =
  'The Zaya Bridal Edit — tiaras, veils, bridal jewelry, personalized accessories and luxury gift boxes for brides in Egypt. Custom pieces made to order, delivered nationwide.';

export const metadata: Metadata = {
  title: 'Bridal Collection & Custom Pieces',
  description,
  alternates: { canonical: '/bride' },
  openGraph: {
    title: `Bridal Collection · ${SITE.name}`,
    description,
    url: `${SITE.url}/bride`,
  },
  keywords: [
    'bridal accessories Egypt',
    'wedding tiara Egypt',
    'bridal veil',
    'personalized bridal gifts',
    'اكسسوارات فرح',
    'طرحة عروسة',
  ],
};

// The admin toggle must apply at request time — never freeze it into a
// build-time prerender.
export const dynamic = 'force-dynamic';

const DEFAULT_CONFIG: BridalPageConfig = {
  enabled: true,
  collections: true,
  personalization: true,
  tiers: true,
  finalCta: true,
  homeSpotlight: true,
  customRequests: true,
};

export default async function BridePage() {
  let config = DEFAULT_CONFIG;
  try {
    config = await getBridalPageConfig();
  } catch {
    // Build/preview without DB bindings — default to visible.
  }

  if (!config.enabled) {
    return <BridalComingSoon />;
  }
  return (
    <BridalLanding
      showCollections={config.collections}
      showPersonalization={config.personalization}
      showTiers={config.tiers}
      showFinalCta={config.finalCta}
      customRequests={config.customRequests}
    />
  );
}
