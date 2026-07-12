import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as bridal from '@/server/services/admin-bridal.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  return bridal.getAdminBridalRequest(id);
});

export const PATCH = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  const bridalRequest = await bridal.patchAdminBridalRequest(id, body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'status_change',
    entity: 'bridal_request',
    entityId: bridalRequest.id,
    meta: { status: bridalRequest.status },
  });
  return bridalRequest;
});
