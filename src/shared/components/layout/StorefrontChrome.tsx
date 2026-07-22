'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/shared/components/layout/Header';
import { Footer } from '@/shared/components/layout/Footer';
import { WhatsAppButton } from '@/shared/components/ui';
import { WelcomeOfferPopup } from '@/features/welcome-offer';
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

  if (isAdmin) {
    return <>{children}</>;
  }

  const whatsappDigits = normalizeWhatsAppDigits(branding.whatsappNumber);

  return (
    <>
      <Header branding={branding} />
      <main className="flex-1">{children}</main>
      <Footer branding={branding} />
      {whatsappDigits ? <WhatsAppButton phoneNumber={whatsappDigits} /> : null}
      <WelcomeOfferPopup />
    </>
  );
}
