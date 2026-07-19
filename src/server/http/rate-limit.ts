import { RateLimitedError } from '@/server/http/errors';

type Bucket = { count: number; resetAt: number };

/** Best-effort per-isolate rate limit (P7 — no KV yet). */
const buckets = new Map<string, Bucket>();

const DEFAULT_LIMIT = 20;
const DEFAULT_WINDOW_MS = 60_000;

export function getClientIp(request: Request): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf;
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return 'unknown';
}

/**
 * Sliding fixed-window counter. Throws RateLimitedError (429) when exceeded.
 * @param key - usually `${route}:${ip}`
 */
export function assertRateLimit(
  key: string,
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
): void {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new RateLimitedError('Too many requests — try again shortly');
  }
}

/** Rate-limit auth login/register/forgot and admin APIs by client IP. */
export function rateLimitByIp(
  request: Request,
  route:
    | 'auth-login'
    | 'auth-register'
    | 'auth-forgot'
    | 'admin'
    | 'temu-import'
    | 'paymob-intention'
    | 'paymob-webhook'
    | 'bosta-webhook',
  limit?: number,
): void {
  const resolvedLimit =
    limit ??
    (route === 'admin'
      ? 60
      : route === 'temu-import'
        ? 10
        : route === 'paymob-webhook' || route === 'bosta-webhook'
          ? 120
          : DEFAULT_LIMIT);
  assertRateLimit(`${route}:${getClientIp(request)}`, resolvedLimit);
}
