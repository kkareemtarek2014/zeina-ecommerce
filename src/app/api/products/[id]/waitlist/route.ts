import { withHandler } from '@/server/http/handler';
import * as waitlistService from '@/server/services/waitlist.service';

type Ctx = { params: Promise<{ id: string }> };

/** POST — subscribe email to back-in-stock waitlist (no auth required). */
export const POST = withHandler(async (request, context) => {
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  return waitlistService.subscribeToWaitlist(id, body);
});

/** GET — check waitlist count for a product. */
export const GET = withHandler(async (_request, context) => {
  const { id } = await (context as Ctx).params;
  const url = new URL(_request.url);
  const email = url.searchParams.get('email') ?? undefined;
  return waitlistService.getWaitlistStatus(id, email);
});
