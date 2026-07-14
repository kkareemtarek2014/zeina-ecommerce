/**
 * Zaya — single place to tune business rules.
 * Change a value here and the whole storefront follows.
 */
export const SITE = {
  name: 'Zaya',
  tagline: 'Adorn yourself effortlessly with premium accessories.',
  description:
    'Shop women\'s accessories online in Egypt — jewelry, bags, scarves, sunglasses & watches. Cash on delivery & fast shipping.',
  /** Production domain — UPDATE when you buy the real domain. */
  url: 'https://zaya-ecommerce.kkareemtarek2.workers.dev/',
  currency: 'EGP',
  locale: 'en-EG',
  keywords: [
    'women accessories Egypt',
    'accessories online Egypt',
    'jewelry Egypt',
    'bags Egypt',
    'اكسسوارات حريمي',
    'اكسسوارات بنات',
    'شنط حريمي',
    'مجوهرات',
    'cash on delivery Egypt',
    'Zaya',
  ],
} as const;

/**
 * Profit margin applied on top of the sourcing cost.
 * Business rule: 25% (allowed range 20–30%).
 */
export const PROFIT_MARGIN = 0.25;

/** Delivery zones used across shipping + governorate data. */
export type ShippingZone = 'cairo_giza' | 'near' | 'far';

/** Shipping cost per delivery zone, in EGP. */
export const SHIPPING_RATES: Record<ShippingZone, number> = {
  cairo_giza: 50,
  near: 80,
  far: 100,
};

/** Orders at or above this subtotal (EGP) ship for free. */
export const FREE_SHIPPING_THRESHOLD = 1500;
