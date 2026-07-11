'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { SITE } from '@/config/site.config';
import { cn } from '@/shared/utils/cn';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { CartDrawer } from '@/features/cart';
import { SearchButton } from '@/features/product-search';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/shop/jewelry', label: 'Jewelry' },
  { href: '/shop/bags', label: 'Bags' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const mounted = useHydrated();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-container items-center justify-between gap-4 px-4 lg:px-8">
        <Link
          href="/"
          className="font-(family-name:--font-display) text-3xl font-bold tracking-wide text-brand-primary italic"
        >
          {SITE.name}
        </Link>

        <nav aria-label="Main navigation" className="hidden gap-8 md:flex">
          {NAV_LINKS.map((link) => (
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
          <SearchButton />
          
          <Link
            href="/login"
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
          {NAV_LINKS.map((link) => (
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
