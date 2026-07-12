import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import { ok } from '@/server/http/envelope';
import { ValidationError } from '@/server/http/errors';
import * as adminCatalog from '@/server/services/admin-catalog.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const form = await request.formData();
  const files = form
    .getAll('file')
    .concat(form.getAll('files'))
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    throw new ValidationError('No image file provided');
  }
  const product = await adminCatalog.addProductImages(id, files);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'product',
    entityId: product.id,
    meta: { images: 'added', count: files.length },
  });
  return ok(product, 201);
});

export const DELETE = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const body = (await request.json()) as { url?: string };
  if (!body.url) throw new ValidationError('url is required');
  const product = await adminCatalog.removeProductImage(id, body.url);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'product',
    entityId: product.id,
    meta: { images: 'removed' },
  });
  return product;
});
