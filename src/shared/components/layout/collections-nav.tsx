import type { LucideIcon } from 'lucide-react';
import { Circle, CircleDot, Cloud, Gift, Moon } from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  small: CircleDot,
  medium: Circle,
  large: Cloud,
  // Legacy slugs (kept until D1 data is reseeded everywhere)
  glow: Moon,
  mystery: Gift,
};

export const CATEGORY_BADGES: Record<
  string,
  { label: string; tone: 'primary' | 'accent' }
> = {
  medium: { label: 'Popular', tone: 'primary' },
  large: { label: 'Big squeeze', tone: 'accent' },
};

export const FEATURED_COLLECTIONS = [
  {
    name: 'New Arrivals',
    href: '/shop?sort=newest',
    desc: 'Fresh squishies from the latest drop',
    badge: 'New',
  },
  {
    name: 'Best Sellers',
    href: '/shop?featured=true',
    desc: 'The squishies everyone squeezes',
    badge: 'Popular',
  },
  {
    name: 'Calm Kits',
    href: '/shop?featured=true',
    desc: 'Ready-packed stress-relief bundles',
    badge: 'Gift-ready',
  },
] as const;

export function categoryHref(slug: string): string {
  return `/shop/${slug}`;
}
