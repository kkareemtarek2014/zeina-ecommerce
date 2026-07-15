/**
 * Storefront deep-links and feature-gated hrefs shared by homepage CTAs,
 * shop URL sync, and promo / bundles surfaces.
 */
import { isFeatureEnabled } from '@/config/features.config';

/** Thin marketing surface for active bundle product IDs (flag-gated). */
export const BUNDLES_PATH = '/bundles';

export const SHOP_NEW_IN_HREF = '/shop?sort=newest';
export const SHOP_BEST_SELLERS_HREF = '/shop?sort=best-selling';

export const HERO_DEFAULT_PRIMARY = {
  label: 'Shop New In',
  href: SHOP_NEW_IN_HREF,
} as const;

export const HERO_DEFAULT_SECONDARY = {
  label: 'Best Sellers',
  href: SHOP_BEST_SELLERS_HREF,
} as const;

/** True when `href` targets the bundles marketing surface (path only). */
export function isBundlesSurfaceHref(href: string): boolean {
  try {
    const path = href.startsWith('http')
      ? new URL(href).pathname
      : href.split(/[?#]/)[0] ?? '';
    return path === BUNDLES_PATH || path === `${BUNDLES_PATH}/`;
  } catch {
    return false;
  }
}

/**
 * Returns the href for storefront CTAs, or `undefined` when the target
 * requires a feature that is currently off (e.g. `/bundles` with `bundles` OFF).
 */
export function resolveVisibleHref(
  href: string | null | undefined,
): string | undefined {
  if (!href?.trim()) return undefined;
  const trimmed = href.trim();
  if (isBundlesSurfaceHref(trimmed) && !isFeatureEnabled('bundles')) {
    return undefined;
  }
  return trimmed;
}
