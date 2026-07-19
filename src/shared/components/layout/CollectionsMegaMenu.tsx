'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { CATEGORIES } from '@/shared/data/categories.data';
import { cn } from '@/shared/utils/cn';
import {
  CATEGORY_BADGES,
  CATEGORY_ICON_MAP,
  FEATURED_COLLECTIONS,
  categoryHref,
} from './collections-nav';

export function CollectionsMegaMenu({ isActive }: { isActive: boolean }) {
  return (
    <div className="group relative">
      <Link
        href="/shop"
        className={cn(
          'relative inline-flex items-center gap-1 py-1 text-sm font-medium transition-colors duration-200',
          isActive
            ? 'text-brand-primary'
            : 'text-text-secondary hover:text-brand-primary',
        )}
      >
        <span>Collections</span>
        <ChevronDown className="size-3.5 transition-transform duration-300 group-hover:rotate-180" />
        <span
          className={cn(
            'absolute bottom-0 left-0 h-0.5 w-full origin-left bg-brand-primary transition-transform duration-300 ease-out',
            isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
          )}
        />
      </Link>

      {/* Invisible Hover Bridge */}
      <div className="absolute top-full left-1/2 h-4 w-150 -translate-x-1/2 opacity-0 group-hover:pointer-events-auto" />

      {/* Mega Menu Dropdown Panel */}
      <div className="pointer-events-none absolute top-[calc(100%+0.75rem)] -left-64 z-50 w-245 max-w-[95vw] origin-top translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface-raised/95 p-7 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-7 space-y-4 border-r border-border/60 pr-8">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-semibold tracking-wider text-text-muted uppercase">
                  Explore Categories
                </h3>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary transition-all hover:gap-1.5"
                >
                  View All Shop <ArrowRight className="size-3" />
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICON_MAP[category.slug] ?? Sparkles;
                  const badge = CATEGORY_BADGES[category.slug];
                  return (
                    <Link
                      key={category.slug}
                      href={categoryHref(category.slug)}
                      className="group/item flex flex-col gap-2 rounded-xl border border-border/40 bg-surface/40 p-3 transition-all duration-200 hover:border-brand-primary/30 hover:bg-brand-blush/60 hover:shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-surface shadow-xs transition-transform group-hover/item:scale-105">
                          <Icon className="size-4 text-brand-primary" />
                        </div>
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
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-text-primary group-hover/item:text-brand-primary">
                          {category.name}
                        </span>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-text-muted">
                          {category.seoDescription.split('—')[0]}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-display text-xs font-semibold tracking-wider text-text-muted uppercase">
                  Featured Edits
                </h3>
                <div className="mt-3 space-y-2">
                  {FEATURED_COLLECTIONS.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group/edit flex items-center justify-between rounded-xl border border-border/50 bg-surface/50 p-3 transition-all duration-200 hover:border-brand-primary/30 hover:bg-brand-blush/40"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary group-hover/edit:text-brand-primary">
                            {item.name}
                          </span>
                          <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 text-[10px] font-semibold text-brand-accent">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted">{item.desc}</p>
                      </div>
                      <ArrowRight className="size-4 text-text-muted transition-transform group-hover/edit:translate-x-1 group-hover/edit:text-brand-primary" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-brand-primary/20 bg-linear-to-br from-brand-blush via-surface to-surface-raised p-4">
                <div className="relative z-10 space-y-2">
                  <span className="inline-block rounded-full bg-brand-primary px-2.5 py-0.5 text-[10px] font-semibold text-text-inverse">
                    Summer Collection &apos;26
                  </span>
                  <h4 className="font-display text-sm font-bold text-text-primary">
                    Handcrafted Elegance
                  </h4>
                  <p className="text-xs text-text-secondary">
                    Discover new statement gold & pearl edits made for every
                    occasion.
                  </p>
                  <Link
                    href="/shop?sort=newest"
                    className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-brand-primary hover:underline"
                  >
                    Explore Drop <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
