import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as inventory from '@/server/services/inventory.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  return inventory.listProductInventory(id);
});
