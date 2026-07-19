export interface PromoCode {
  code: string;
  type: 'fixed' | 'percentage';
  value: number; // For fixed it's amount in EGP, for percentage it's a decimal (e.g., 0.1 for 10%)
  minOrderValue?: number; // Minimum subtotal required to apply the promo
}

export const PROMOS_DB: PromoCode[] = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 0.1, // 10% off
  },
  {
    code: 'SQOOSH50',
    type: 'fixed',
    value: 50, // 50 EGP off
    minOrderValue: 500,
  },
  {
    code: 'ZAYFRIEND10',
    type: 'percentage',
    value: 0.1, // Shared referral — give friends 10% off
  },
];

export function validatePromoCode(code: string, subtotal: number): { valid: boolean; error?: string; discount?: number } {
  const promo = PROMOS_DB.find((p) => p.code.toUpperCase() === code.toUpperCase());

  if (!promo) {
    return { valid: false, error: 'Invalid promo code' };
  }

  if (promo.minOrderValue && subtotal < promo.minOrderValue) {
    return { valid: false, error: `Minimum order value for this code is ${promo.minOrderValue} EGP` };
  }

  let discountAmount = 0;
  if (promo.type === 'percentage') {
    discountAmount = subtotal * promo.value;
  } else if (promo.type === 'fixed') {
    discountAmount = promo.value;
  }

  return { valid: true, discount: discountAmount };
}
