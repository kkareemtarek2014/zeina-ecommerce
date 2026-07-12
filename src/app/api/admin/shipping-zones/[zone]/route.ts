import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as locations from '@/server/services/admin-locations.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ zone: string }> };

export const PUT = withHandler(async (request, context) => {
  const auth = await requireAdmin(request);
  const { zone } = await (context as Ctx).params;
  const body: unknown = await request.json();
  const shippingZone = await locations.updateAdminShippingZoneFee(zone, body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'shipping_zone',
    entityId: shippingZone.zone,
    meta: { fee: shippingZone.fee },
  });
  return shippingZone;
});
