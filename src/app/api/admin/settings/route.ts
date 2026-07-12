import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as settingsService from '@/server/services/settings.service';
import { writeAuditLog } from '@/server/services/audit.service';

export const GET = withHandler(async (request) => {
  await requireAdmin(request);
  return settingsService.getAdminSettings();
});

export const PUT = withHandler(async (request) => {
  const auth = await requireAdmin(request);
  const body: unknown = await request.json();
  const settings = await settingsService.updateAdminSettings(body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'settings',
    entityId: 'settings',
  });
  return settings;
});
