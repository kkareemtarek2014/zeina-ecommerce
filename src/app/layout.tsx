import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Jost, Playfair_Display } from 'next/font/google';
import { SITE } from '@/config/site.config';
import { StorefrontChrome } from '@/shared/components/layout/StorefrontChrome';
import { getSiteBranding } from '@/server/services/settings.service';
import { Providers } from './providers';
import './globals.css';

const jost = Jost({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getSiteBranding();
  const titleDefault =
    branding.seoDefaultTitle?.trim() ||
    `${branding.siteName} — ${branding.siteTagline}`;
  const description =
    branding.seoDefaultDescription?.trim() || SITE.description;

  return {
    metadataBase: new URL(branding.siteUrl),
    title: {
      default: titleDefault,
      template: `%s · ${branding.siteName}`,
    },
    description,
    alternates: {
      canonical: '/',
    },
    icons: branding.faviconUrl
      ? { icon: branding.faviconUrl }
      : undefined,
    openGraph: {
      title: titleDefault,
      description,
      url: branding.siteUrl,
      siteName: branding.siteName,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: branding.siteName,
        },
      ],
      locale: SITE.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleDefault,
      description,
      images: ['/og-image.png'],
      site: '@zaya',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const branding = await getSiteBranding();

  return (
    <html lang="en" className={`${jost.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <Providers>
          <StorefrontChrome branding={branding}>{children}</StorefrontChrome>
        </Providers>
      </body>
    </html>
  );
}
