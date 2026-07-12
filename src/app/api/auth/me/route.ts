import { withHandler } from '@/server/http/handler';
import * as authService from '@/server/services/auth.service';

export const GET = withHandler(async (request) => authService.me(request));
