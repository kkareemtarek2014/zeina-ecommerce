'use client';

import Link from 'next/link';
import { SITE } from '@/config/site.config';
import { CATEGORIES } from '@/shared/data/categories.data';
import { Mail, ArrowRight } from 'lucide-react';

const HELP_LINKS = [
  { href: '/shop', label: 'Shop All' },
  { href: '/bride/custom', label: 'Bridal Requests' },
  { href: '/account', label: 'My Account' },
  { href: '/account/orders', label: 'Track My Order' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
];

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/cookies', label: 'Cookie Policy' },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-white pt-16 pb-8">
      <div className="mx-auto max-w-container px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand & Newsletter Column */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div>
              <p className="font-(family-name:--font-display) text-4xl font-bold tracking-tight text-brand-primary italic">
                {SITE.name}
              </p>
              <p className="mt-4 max-w-md text-base leading-relaxed text-text-secondary">
                {SITE.description}
              </p>
            </div>

            <div className="mt-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">
                Subscribe to our newsletter
              </h3>
              <form
                className="relative flex max-w-md items-center"
                onSubmit={(e) => e.preventDefault()}
              >
                <Mail className="absolute left-3.5 h-5 w-5 text-text-muted" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email address"
                  className="w-full rounded-full border border-border bg-brand-blush/20 py-3 pl-12 pr-14 text-sm outline-none transition-all focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary"
                />
                <button
                  type="submit"
                  className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white transition-transform hover:scale-105"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Categories */}
          <div className="lg:col-span-3">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">
              Shop
            </h3>
            <ul className="flex flex-col gap-3">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/shop/${cat.slug}`}
                    className="text-sm text-text-secondary transition-colors hover:text-brand-primary"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div className="lg:col-span-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">
              Help
            </h3>
            <ul className="flex flex-col gap-3">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary transition-colors hover:text-brand-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-text-muted md:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <ul className="flex gap-6">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-brand-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
