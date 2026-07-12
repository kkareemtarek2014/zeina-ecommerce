import type { ApiErrorCode } from './errors';

export type ApiOk<T> = { ok: true; data: T };

export type ApiErr = {
  ok: false;
  error: { code: ApiErrorCode; message: string; details?: unknown };
};

export type ApiResponse<T> = ApiOk<T> | ApiErr;
