'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  ChevronDown,
  Menu,
  Sparkles,
  User,
} from 'lucide-react';
import { CATEGORIES } from '@/shared/data/categories.data';
import { Drawer } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';
import {
  CATEGORY_BADGES,
  CATEGORY_ICON_MAP,
  FEATURED_COLLECTIONS,
  categoryHref,
} from './collections-nav';

export interface MobileNavLink {
  href: string;
  label: string;
}

interface MobileNavDrawerProps {
  links: MobileNavLink[];
  siteName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNavDrawer({
  links,
  siteName,
  isOpen,
  onOpenChange,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const shopActive =
    pathname === '/shop' || pathname.startsWith('/shop/');
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const wasDrawerOpenRef = useRef(false);
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    onOpenChangeRef.current(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen && !wasDrawerOpenRef.current) {
      setCollectionsOpen(shopActive);
    }
    wasDrawerOpenRef.current = isOpen;
  }, [isOpen, shopActive]);

  const close = () => onOpenChange(false);

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        onClick={() => onOpenChange(!isOpen)}
        className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-brand-blush md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <Drawer
        isOpen={isOpen}
        onClose={close}
        title={siteName}
        side="left"
      >
        <div id="mobile-nav-drawer" className="flex h-full flex-col">
          <nav
            aria-label="Mobile navigation"
            className="flex flex-1 flex-col gap-1"
          >
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));

              if (link.label === 'Collections') {
                return (
                  <div key={link.href} className="space-y-1">
                    <button
                      type="button"
                      aria-expanded={collectionsOpen}
                      aria-controls="mobile-collections-panel"
                      onClick={() => setCollectionsOpen((open) => !open)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors',
                        isActive || shopActive || collectionsOpen
                          ? 'bg-brand-blush/70 text-brand-primary'
                          : 'text-text-primary hover:bg-brand-blush/50',
                      )}
                    >
                      <span>Collections</span>
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          'size-4 shrink-0 transition-transform duration-300',
                          collectionsOpen && 'rotate-180',
                        )}
                      />
                    </button>

                    {collectionsOpen ? (
                      <div
                        id="mobile-collections-panel"
                        className="space-y-4 border-l-2 border-brand-primary/15 py-2 pr-1 pl-3"
                      >
                        <Link
                          href="/shop"
                          onClick={close}
                          className="inline-flex items-center gap-1 px-1 text-xs font-semibold text-brand-primary transition-colors hover:underline"
                        >
                          View all shop <ArrowRight className="size-3" />
                        </Link>

                        <div>
                          <p className="mb-2 px-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
                            Categories
                          </p>
                          <ul className="space-y-0.5">
                            {CATEGORIES.map((category) => {
                              const Icon =
                                CATEGORY_ICON_MAP[category.slug] ?? Sparkles;
                              const badge = CATEGORY_BADGES[category.slug];
                              const href = categoryHref(category.slug);
                              const catActive =
                                pathname === href ||
                                pathname.startsWith(`${href}/`);

                              return (
                                <li key={category.slug}>
                                  <Link
                                    href={href}
                                    onClick={close}
                                    className={cn(
                                      'flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors',
                                      catActive
                                        ? 'bg-brand-blush text-brand-primary'
                                        : 'text-text-secondary hover:bg-brand-blush/40 hover:text-text-primary',
                                    )}
                                  >
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-surface">
                                      <Icon
                                        className={cn(
                                          'size-3.5',
                                          category.slug === 'bride'
                                            ? 'text-brand-accent'
                                            : 'text-brand-primary',
                                        )}
                                      />
                                    </span>
                                    <span className="min-w-0 flex-1 text-sm font-medium">
                                      {category.name}
                                    </span>
                                    {badge && (
                                      <span
                                        className={cn(
                                          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                                          badge.tone === 'accent'
                                            ? 'bg-brand-accent/15 text-brand-accent'
                                            : 'bg-brand-primary/10 text-brand-primary',
                                        )}
                                      >
                                        {badge.label}
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        <div>
                          <p className="mb-2 px-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
                            Featured edits
                          </p>
                          <ul className="space-y-1">
                            {FEATURED_COLLECTIONS.map((item) => (
                              <li key={item.name}>
                                <Link
                                  href={item.href}
                                  onClick={close}
                                  className="group flex items-start justify-between gap-2 rounded-lg border border-border/50 bg-surface/60 px-3 py-2.5 transition-colors hover:border-brand-primary/25 hover:bg-brand-blush/40"
                                >
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-sm font-semibold text-text-primary group-hover:text-brand-primary">
                                        {item.name}
                                      </span>
                                      <span className="rounded-full bg-brand-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-accent">
                                        {item.badge}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-text-muted">
                                      {item.desc}
                                    </p>
                                  </div>
                                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-primary" />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Link
                          href="/shop?sort=newest"
                          onClick={close}
                          className="block overflow-hidden rounded-xl border border-brand-primary/20 bg-linear-to-br from-brand-blush via-surface to-surface-raised p-3.5"
                        >
                          <span className="inline-block rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-semibold text-text-inverse">
                            Summer Collection &apos;26
                          </span>
                          <p className="mt-2 font-display text-sm font-bold text-text-primary">
                            Handcrafted Elegance
                          </p>
                          <p className="mt-1 text-xs text-text-secondary">
                            Statement gold & pearl edits for every occasion.
                          </p>
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary">
                            Explore drop <ArrowRight className="size-3" />
                          </span>
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={cn(
                    'rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-blush/70 text-brand-primary'
                      : 'text-text-primary hover:bg-brand-blush/50',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-border pt-4">
            <Link
              href="/account"
              onClick={close}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-brand-blush/50"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-blush text-brand-primary">
                <User className="size-4" />
              </span>
              My account
            </Link>
          </div>
        </div>
      </Drawer>
    </>
  );
}
