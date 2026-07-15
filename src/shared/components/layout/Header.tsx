'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, User, X } from 'lucide-react';
import { SITE, FREE_SHIPPING_THRESHOLD } from '@/config/site.config';
import { cn } from '@/shared/utils/cn';
import { useFeature } from '@/shared/contexts/FeatureContext';
import { CartDrawer } from '@/features/cart';
import { SearchButton } from '@/features/product-search';
import { useStorefrontConfig } from '@/features/admin';
import type { FeatureKey } from '@/config/features.config';

const NAV_LINKS: {
  href: string;
  label: string;
  feature?: FeatureKey;
  bridal?: boolean;
}[] = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop', feature: 'shop' },
  { href: '/shop/jewelry', label: 'Jewelry', feature: 'shop' },
  { href: '/shop/bags', label: 'Bags', feature: 'shop' },
  { href: '/bride', label: 'Bride', bridal: true },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
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

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      {/* Announcement bar */}
      <div className="bg-brand-primary text-text-inverse">
        <div className="mx-auto flex max-w-container items-center justify-center gap-6 overflow-x-auto px-4 py-2 text-xs font-medium tracking-wide whitespace-nowrap lg:px-8">
          <span>✨ New drop every week</span>
          <span aria-hidden className="opacity-40">·</span>
          <span>Free shipping over {FREE_SHIPPING_THRESHOLD.toLocaleString()} EGP</span>
          <span aria-hidden className="hidden opacity-40 sm:inline">·</span>
          <span className="hidden sm:inline">Cash on delivery, Egypt-wide</span>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-container items-center justify-between gap-4 px-4 lg:px-8">
        <Link
          href="/"
          className="font-(family-name:--font-display) text-3xl font-bold tracking-wide text-brand-primary italic"
        >
          {SITE.name}
        </Link>

        <nav aria-label="Main navigation" className="hidden gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm transition-colors hover:text-brand-primary',
                pathname === link.href
                  ? 'font-medium text-brand-primary'
                  : 'text-text-secondary',
              )}
            >
              {link.label}
            </Link>
          ))}
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

          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-brand-blush md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-border bg-surface-raised md:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'block px-6 py-3 text-sm transition-colors',
                pathname === link.href
                  ? 'font-medium text-brand-primary'
                  : 'text-text-secondary',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
