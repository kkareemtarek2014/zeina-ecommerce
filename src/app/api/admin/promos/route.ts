import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as promos from '@/server/services/admin-promos.service';
import { writeAuditLog } from '@/server/services/audit.service';

export const GET = withHandler(async (request) => {
  await requireAdmin(request);
  return promos.listAdminPromos();
});

export const POST = withHandler(async (request) => {
  const auth = await requireAdmin(request);
  const body: unknown = await request.json();
  const promo = await promos.createAdminPromo(body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'create',
    entity: 'promo',
    entityId: promo.code,
  });
  return promo;
});
