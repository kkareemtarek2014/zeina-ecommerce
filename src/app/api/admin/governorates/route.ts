import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as locations from '@/server/services/admin-locations.service';
import { writeAuditLog } from '@/server/services/audit.service';

export const GET = withHandler(async (request) => {
  await requireAdmin(request);
  return locations.listAdminGovernorates();
});

export const POST = withHandler(async (request) => {
  const auth = await requireAdmin(request);
  const body: unknown = await request.json();
  const governorate = await locations.createAdminGovernorate(body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'create',
    entity: 'governorate',
    entityId: governorate.id,
  });
  return governorate;
});
