import type { ApiErrorCode } from '@/shared/contracts/errors';
import type { ApiResponse } from '@/shared/contracts/envelope';

export function ok<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = { ok: true, data };
  return Response.json(body, { status });
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown,
): Response {
  const body: ApiResponse<never> = {
    ok: false,
    error: details === undefined ? { code, message } : { code, message, details },
  };
  return Response.json(body, { status });
}
