import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as promos from '@/server/services/admin-promos.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ code: string }> };

export const PUT = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { code } = await (context as Ctx).params;
  const decodedCode = decodeURIComponent(code);
  const body: unknown = await request.json();
  const promo = await promos.updateAdminPromo(decodedCode, body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'promo',
    entityId: promo.code,
  });
  return promo;
});

export const PATCH = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { code } = await (context as Ctx).params;
  const decodedCode = decodeURIComponent(code);
  const body: unknown = await request.json();
  const promo = await promos.toggleAdminPromo(decodedCode, body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'promo',
    entityId: promo.code,
    meta: { active: promo.active },
  });
  return promo;
});

export const DELETE = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { code } = await (context as Ctx).params;
  const decodedCode = decodeURIComponent(code);
  const result = await promos.deleteAdminPromo(decodedCode);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'delete',
    entity: 'promo',
    entityId: decodedCode,
  });
  return result;
});
