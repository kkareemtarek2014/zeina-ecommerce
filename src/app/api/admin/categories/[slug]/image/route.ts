import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import { ValidationError } from '@/server/http/errors';
import * as adminCatalog from '@/server/services/admin-catalog.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ slug: string }> };

export const POST = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { slug } = await (context as Ctx).params;
  const decodedSlug = decodeURIComponent(slug);
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new ValidationError('No image file provided');
  }
  const category = await adminCatalog.setCategoryImage(decodedSlug, file);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'category',
    entityId: category.slug,
    meta: { image: 'updated' },
  });
  return category;
});
