import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as adminCatalog from '@/server/services/admin-catalog.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ slug: string }> };

export const PUT = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { slug } = await (context as Ctx).params;
  const decodedSlug = decodeURIComponent(slug);
  const body: unknown = await request.json();
  const category = await adminCatalog.updateAdminCategory(decodedSlug, body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'category',
    entityId: category.slug,
  });
  return category;
});

export const DELETE = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { slug } = await (context as Ctx).params;
  const decodedSlug = decodeURIComponent(slug);
  const result = await adminCatalog.deleteAdminCategory(decodedSlug);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'delete',
    entity: 'category',
    entityId: decodedSlug,
  });
  return result;
});
