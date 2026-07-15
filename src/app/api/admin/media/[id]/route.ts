import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as adminMedia from '@/server/services/admin-media.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withHandler(async (request, context) => {
  const auth = await requirePermission(request, 'media:write');
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  const result = await adminMedia.updateAdminMediaAlt(id, body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'media',
    entityId: id,
    meta: { alt: true },
  });
  return result;
});

export const DELETE = withHandler(async (request, context) => {
  const auth = await requirePermission(request, 'media:write');
  const { id } = await (context as Ctx).params;
  const result = await adminMedia.deleteAdminMedia(id);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'delete',
    entity: 'media',
    entityId: id,
    meta: { media: true },
  });
  return result;
});
