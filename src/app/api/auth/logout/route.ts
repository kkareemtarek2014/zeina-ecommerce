import { withHandler } from '@/server/http/handler';
import * as authService from '@/server/services/auth.service';

export const POST = withHandler(async (request) => authService.logout(request));
