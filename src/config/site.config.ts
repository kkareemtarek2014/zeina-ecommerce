/**
 * Sqoosh — single place to tune business rules.
 * Change a value here and the whole storefront follows.
 */
export const SITE = {
  name: 'Sqoosh',
  tagline: 'Squeeze the stress away.',
  description:
    'Shop squishy stress toys online in Egypt — small, medium & jumbo slow-rising squishies for everyday calm. Cash on delivery & fast shipping.',
  /** Production domain — UPDATE when you buy the real domain (sqoosh-eg.com). */
  url: 'https://sqoosh-eg.com',
  currency: 'EGP',
  locale: 'en-EG',
  keywords: [
    'squishy toys Egypt',
    'stress toys Egypt',
    'slow rising squishy',
    'fidget toys Egypt',
    'سكويشي',
    'سكويشي مصر',
    'العاب ضغط',
    'فيدجت',
    'سكوش',
    'cash on delivery Egypt',
    'Sqoosh',
  ],
} as const;

/**
 * Profit margin applied on top of the landed sourcing cost.
 * Business rule: 60% (allowed range 40–80%). See BUSINESS-PLAN.md §2b.
 */
export const PROFIT_MARGIN = 0.6;

/** Delivery zones used across shipping + governorate data. */
export type ShippingZone = 'cairo_giza' | 'near' | 'far';

/** Shipping cost per delivery zone, in EGP. */
export const SHIPPING_RATES: Record<ShippingZone, number> = {
  cairo_giza: 50,
  near: 80,
  far: 100,
};

/** Orders at or above this subtotal (EGP) ship for free. */
export const FREE_SHIPPING_THRESHOLD = 500;
