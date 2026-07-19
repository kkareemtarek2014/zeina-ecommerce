import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as adminCatalog from '@/server/services/admin-catalog.service';
import { ValidationError } from '@/server/http/errors';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'products:read');
  const url = new URL(request.url);
  if ((url.searchParams.get('format') ?? 'csv') !== 'csv') {
    throw new ValidationError('Only format=csv is supported');
  }
  const csv = await adminCatalog.exportAdminProductsCsv();
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sqoosh-products.csv"',
    },
  });
});
