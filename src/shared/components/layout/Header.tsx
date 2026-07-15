'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useFeature } from '@/shared/contexts/FeatureContext';
import { CartDrawer } from '@/features/cart';
import { SearchButton } from '@/features/product-search';
import { useStorefrontConfig } from '@/features/admin';
import type { FeatureKey } from '@/config/features.config';
import type { SiteBrandingDTO } from '@/shared/contracts/storefront-branding.contract';
import { AnnouncementBar } from './AnnouncementBar';
import { CollectionsMegaMenu } from './CollectionsMegaMenu';
import { MobileNavDrawer } from './MobileNavDrawer';

const NAV_LINKS: {
  href: string;
  label: string;
  feature?: FeatureKey;
  bridal?: boolean;
}[] = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Collections', feature: 'shop' },
  { href: '/bride', label: 'Bride', bridal: true },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

interface HeaderProps {
  branding: SiteBrandingDTO;
}

export function Header({ branding }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isShopEnabled = useFeature('shop');
  const isSearchEnabled = useFeature('product-search');
  const { data: storefrontConfig } = useStorefrontConfig();
  // Visible by default; hidden only when the admin toggle is explicitly off.
  const isBridalVisible = storefrontConfig?.bridalPage !== false;

  const navLinks = NAV_LINKS.filter((link) => {
    if (link.feature && !isShopEnabled) return false;
    if (link.bridal && !isBridalVisible) return false;
    return true;
  });

  const handleMenuOpenChange = useCallback((open: boolean) => {
    setMenuOpen(open);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <AnnouncementBar items={branding.announcements} />

      <div className="mx-auto flex h-16 max-w-container items-center justify-between gap-4 px-4 lg:px-8">
        <Link
          href="/"
          className="font-display text-3xl font-bold tracking-wide text-brand-primary italic"
        >
          {branding.logoUrl ? (
            // next/image with unoptimized:true (project lock)
            <Image
              src={branding.logoUrl}
              alt={branding.siteName}
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
              unoptimized
            />
          ) : (
            branding.siteName
          )}
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));

            if (link.label === 'Collections') {
              return (
                <CollectionsMegaMenu key={link.href} isActive={isActive} />
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'group relative py-1 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'text-brand-primary'
                    : 'text-text-secondary hover:text-brand-primary',
                )}
              >
                <span>{link.label}</span>
                <span
                  className={cn(
                    'absolute bottom-0 left-0 h-0.5 w-full origin-left bg-brand-primary transition-transform duration-300 ease-out',
                    isActive
                      ? 'scale-x-100'
                      : 'scale-x-0 group-hover:scale-x-100',
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isSearchEnabled && <SearchButton />}

          <Link
            href="/account"
            aria-label="User account"
            className="flex size-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-brand-blush"
          >
            <User className="size-5" />
          </Link>

          <CartDrawer />

          <MobileNavDrawer
            links={navLinks}
            siteName={branding.siteName}
            isOpen={menuOpen}
            onOpenChange={handleMenuOpenChange}
          />
        </div>
      </div>
    </header>
  );
}
