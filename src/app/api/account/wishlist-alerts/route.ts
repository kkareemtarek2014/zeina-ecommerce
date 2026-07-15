import { withHandler } from '@/server/http/handler';
import { requireAuth } from '@/server/auth/require-auth';
import * as wishlistAlertsService from '@/server/services/wishlist-alerts.service';

export const GET = withHandler(async (request) => {
  const { user } = await requireAuth(request);
  return wishlistAlertsService.getUserAlertPreferences(user.id);
});

export const PUT = withHandler(async (request) => {
  const { user } = await requireAuth(request);
  const body: unknown = await request.json();
  return wishlistAlertsService.toggleWishlistAlert(user.id, body);
});
