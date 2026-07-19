import { withHandler } from '@/server/http/handler';
import { NotFoundError } from '@/server/http/errors';
import { getUploadObject } from '@/server/services/upload.service';

type Ctx = { params: Promise<{ key: string[] }> };

/**
 * Reads R2 objects under UPLOADS.
 * - `products/…` and `categories/…` (catalog images) are public.
 * Responses set `nosniff` + a locked-down CSP so an uploaded SVG/HTML can never
 * execute script if opened as a top-level document.
 */
export const GET = withHandler(async (request, context) => {
  const { key: parts } = await (context as Ctx).params;
  const key = parts.map((p) => decodeURIComponent(p)).join('/');
  if (!key || key.includes('..')) {
    throw new NotFoundError('Not found');
  }

  const obj = await getUploadObject(key);
  if (!obj) throw new NotFoundError('Not found');

  const headers = new Headers();
  headers.set(
    'Content-Type',
    obj.httpMetadata?.contentType || 'application/octet-stream',
  );
  headers.set(
    'Cache-Control',
    'public, max-age=31536000, immutable',
  );
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Security-Policy', "default-src 'none'; sandbox");
  if (obj.size != null) headers.set('Content-Length', String(obj.size));

  return new Response(obj.body, { status: 200, headers });
});
