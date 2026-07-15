export type FeatureKey =
  | 'shop'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'order'
  | 'account'
  | 'bridal-custom'
  | 'product-search'
  | 'auth'
  | 'wallet'
  | 'promo_code'
  | 'order_note'
  | 'homepage_builder'
  | 'dynamic_pricing'
  | 'bundles'
  | 'preorders'
  | 'social_proof'
  | 'social_auth'
  | 'online_payments'
  | 'bosta_shipping';

export interface FeatureConfig {
  key: FeatureKey;
  label: string;
  enabled: boolean;
  routes?: string[];
}

export const FEATURES: Record<FeatureKey, FeatureConfig> = {
  shop: { key: 'shop', label: 'Shop', enabled: true },
  product: { key: 'product', label: 'Product', enabled: true },
  cart: { key: 'cart', label: 'Cart', enabled: true },
  checkout: { key: 'checkout', label: 'Checkout', enabled: true },
  order: { key: 'order', label: 'Order', enabled: true, routes: ['/order'] },
  account: { key: 'account', label: 'Account', enabled: true, routes: ['/account'] },
  'bridal-custom': { key: 'bridal-custom', label: 'Bridal Custom', enabled: true },
  'product-search': { key: 'product-search', label: 'Product Search', enabled: true },
  auth: { key: 'auth', label: 'Authentication', enabled: true, routes: ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'] },
  wallet: { key: 'wallet', label: 'Wallet', enabled: false, routes: ['/account/wallet'] },
  promo_code: { key: 'promo_code', label: 'Promo Code', enabled: true },
  order_note: { key: 'order_note', label: 'Order Note', enabled: true },
  homepage_builder: {
    key: 'homepage_builder',
    label: 'Homepage Builder',
    // OFF for now — storefront renders ClassicHome; /admin/homepage 404s.
    enabled: false,
    routes: ['/admin/homepage'],
  },
  dynamic_pricing: {
    key: 'dynamic_pricing',
    label: 'Dynamic Pricing (landed cost)',
    enabled: false,
  },
  bundles: {
    key: 'bundles',
    label: 'Bundles & upselling',
    enabled: true,
    routes: ['/bundles'],
  },
  preorders: {
    key: 'preorders',
    label: 'Pre-orders',
    enabled: false,
  },
  social_proof: {
    key: 'social_proof',
    label: 'Social proof (Instagram)',
    enabled: false,
  },
  social_auth: {
    key: 'social_auth',
    label: 'Social login (Google/Facebook)',
    enabled: false,
  },
  online_payments: {
    key: 'online_payments',
    label: 'Online payments (Paymob card/wallet)',
    enabled: false,
  },
  bosta_shipping: {
    key: 'bosta_shipping',
    label: 'Bosta shipping',
    enabled: false,
  },
};

export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES[key]?.enabled ?? false;
}
