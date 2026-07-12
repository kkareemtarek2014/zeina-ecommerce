import { withHandler } from '@/server/http/handler';
import * as authService from '@/server/services/auth.service';

export const POST = withHandler(async (request) => {
  const body: unknown = await request.json();
  return authService.forgotPassword(body);
});
