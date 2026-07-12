import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as locations from '@/server/services/admin-locations.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  const governorate = await locations.updateAdminGovernorate(id, body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'governorate',
    entityId: governorate.id,
  });
  return governorate;
});

export const DELETE = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const result = await locations.deleteAdminGovernorate(id);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'delete',
    entity: 'governorate',
    entityId: id,
  });
  return result;
});
