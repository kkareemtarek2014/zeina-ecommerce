import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import { adminOrderBulkStatusSchema } from '@/shared/contracts/admin-ops.contract';
import { ValidationError } from '@/server/http/errors';
import { ok } from '@/server/http/envelope';
import * as adminOrders from '@/server/services/admin-orders.service';

export const POST = withHandler(async (request) => {
  const { user } = await requirePermission(request, 'orders:write');

  const body = await request.json();
  const parsed = adminOrderBulkStatusSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid bulk status payload', parsed.error.flatten());
  }

  const result = await adminOrders.bulkUpdateAdminOrderStatus(
    parsed.data.ids,
    parsed.data.status,
    user.id,
  );

  return ok(result);
});
