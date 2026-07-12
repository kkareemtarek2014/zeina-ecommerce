import { fail, ok } from './envelope';
import { AppError } from './errors';

type HandlerFn = (request: Request, context: unknown) => Promise<unknown> | unknown;

/**
 * Thin wrapper for Route Handlers: runs the handler and maps results / AppError
 * into the standard API envelope.
 */
export function withHandler(handler: HandlerFn) {
  return async (request: Request, context: unknown): Promise<Response> => {
    try {
      const data = await handler(request, context);
      if (data instanceof Response) return data;
      return ok(data);
    } catch (err) {
      if (err instanceof AppError) {
        return fail(err.code, err.message, err.status, err.details);
      }
      console.error(err);
      return fail('INTERNAL', 'Internal server error', 500);
    }
  };
}
