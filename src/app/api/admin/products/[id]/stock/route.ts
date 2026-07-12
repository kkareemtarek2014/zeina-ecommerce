import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as inventory from '@/server/services/inventory.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  const product = await inventory.adjustProductStock(id, body, auth.user.id);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'product',
    entityId: id,
    meta: { stockAdjust: true },
  });
  return product;
});
