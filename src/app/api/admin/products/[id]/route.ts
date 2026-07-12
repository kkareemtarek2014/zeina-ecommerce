import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as adminCatalog from '@/server/services/admin-catalog.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  return adminCatalog.getAdminProduct(id);
});

export const PUT = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  const product = await adminCatalog.updateAdminProduct(id, body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'product',
    entityId: product.id,
  });
  return product;
});

export const DELETE = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const result = await adminCatalog.deleteAdminProduct(id);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'delete',
    entity: 'product',
    entityId: id,
  });
  return result;
});
