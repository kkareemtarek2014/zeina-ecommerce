import 'server-only';
import { waitlistSubscribeSchema } from '@/shared/contracts/waitlist.contract';
import type { WaitlistStatusDTO } from '@/shared/contracts/waitlist.contract';
import { getRequestDb } from '@/server/db/request';
import { NotFoundError, ValidationError } from '@/server/http/errors';
import { isEffectivelyInStock } from '@/server/lib/stock';
import * as productsRepo from '@/server/repositories/products.repo';
import * as waitlistRepo from '@/server/repositories/waitlist.repo';

/**
 * Subscribe an email to back-in-stock notifications for a product.
 * Only allowed when the product exists and is out of stock.
 */
export async function subscribeToWaitlist(
  productId: string,
  raw: unknown,
): Promise<{ ok: true }> {
  const parsed = waitlistSubscribeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const db = await getRequestDb();
  const product = await productsRepo.findProductById(db, productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  if (isEffectivelyInStock(product)) {
    throw new ValidationError('This product is already in stock');
  }

  await waitlistRepo.subscribe(db, productId, parsed.data.email);
  return { ok: true };
}

/**
 * Get waitlist status for a product (count of pending subscribers).
 */
export async function getWaitlistStatus(
  productId: string,
  email?: string,
): Promise<WaitlistStatusDTO> {
  const db = await getRequestDb();
  const waitlistCount = await waitlistRepo.countForProduct(db, productId);
  const subscribed = email
    ? await waitlistRepo.isSubscribed(db, productId, email)
    : false;
  return { subscribed, waitlistCount };
}
