import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as adminCatalog from '@/server/services/admin-catalog.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const product = await adminCatalog.restoreAdminProduct(id);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'product',
    entityId: product.id,
    meta: { restore: true, status: 'draft' },
  });
  return product;
});
