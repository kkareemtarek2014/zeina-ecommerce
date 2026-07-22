'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/shared/components/layout/Header';
import { Footer } from '@/shared/components/layout/Footer';
import { WhatsAppButton } from '@/shared/components/ui';
import { WelcomeOfferPopup } from '@/features/welcome-offer';
import { useStorefrontConfig } from '@/features/admin';
import type { SiteBrandingDTO } from '@/shared/contracts/storefront-branding.contract';
import { normalizeWhatsAppDigits } from '@/shared/lib/contact-links';

/** Hide storefront chrome on /admin/** (admin has its own shell). */
export function StorefrontChrome({
  children,
  branding,
}: {
  children: ReactNode;
  branding: SiteBrandingDTO;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  // The layout branding is captured when the shell is rendered (often at build
  // time, where D1 falls back to null). Read the WhatsApp number from the
  // request-time storefront config too, so saving it in Admin → Settings makes
  // the FAB appear without a redeploy. Fall back to the branding prop.
  const { data: storefrontConfig } = useStorefrontConfig();
  const whatsappDigits = normalizeWhatsAppDigits(
    storefrontConfig?.whatsappNumber ?? branding.whatsappNumber,
  );

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header branding={branding} />
      <main className="flex-1">{children}</main>
      <Footer branding={branding} />
      {whatsappDigits ? (
        <WhatsAppButton
          phoneNumber={whatsappDigits}
          liftAboveStickyBuy={pathname?.startsWith('/product/') ?? false}
        />
      ) : null}
      <WelcomeOfferPopup />
    </>
  );
}
