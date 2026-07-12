import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as adminOrders from '@/server/services/admin-orders.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  const order = await adminOrders.patchAdminOrderStatus(id, body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'status_change',
    entity: 'order',
    entityId: order.id,
    meta: { status: order.status },
  });
  return order;
});
