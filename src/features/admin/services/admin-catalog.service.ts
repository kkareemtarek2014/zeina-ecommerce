import { api } from '@/shared/lib/api-client';
import { AppError, type ApiErrorCode } from '@/shared/contracts/errors';
import type { ApiResponse } from '@/shared/contracts/envelope';
import type {
  AdminCategoryDTO,
  AdminCategoryWrite,
  AdminCsvImportReport,
  AdminMediaDTO,
  AdminProductBulk,
  AdminProductBulkResult,
  AdminProductDTO,
  AdminProductWrite,
  Paginated,
} from '@/shared/contracts/admin-catalog.contract';
import type {
  AdminStockAdjust,
  InventoryMovementDTO,
} from '@/shared/contracts/admin-inventory.contract';

export type AdminProductListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
  featured?: boolean;
  inStock?: boolean;
  status?: string;
  sort?: string;
  lowStock?: boolean;
};

function productsQuery(params: AdminProductListParams): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params.q) sp.set('q', params.q);
  if (params.category) sp.set('category', params.category);
  if (params.featured != null) sp.set('featured', String(params.featured));
  if (params.inStock != null) sp.set('inStock', String(params.inStock));
  if (params.status) sp.set('status', params.status);
  if (params.sort) sp.set('sort', params.sort);
  if (params.lowStock) sp.set('lowStock', '1');
  const q = sp.toString();
  return q ? `?${q}` : '';
}

async function delWithBody<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) {
    throw new AppError(
      json.error.code as ApiErrorCode,
      json.error.message,
      json.error.details,
    );
  }
  return json.data;
}

export const adminCatalogService = {
  listProducts(
    params: AdminProductListParams = {},
  ): Promise<Paginated<AdminProductDTO>> {
    return api.get(`/api/admin/products${productsQuery(params)}`);
  },

  getProduct(id: string): Promise<AdminProductDTO> {
    return api.get(`/api/admin/products/${encodeURIComponent(id)}`);
  },

  createProduct(input: AdminProductWrite): Promise<AdminProductDTO> {
    return api.post('/api/admin/products', input);
  },

  updateProduct(id: string, input: AdminProductWrite): Promise<AdminProductDTO> {
    return api.put(`/api/admin/products/${encodeURIComponent(id)}`, input);
  },

  deleteProduct(id: string): Promise<{ ok: true }> {
    return api.del(`/api/admin/products/${encodeURIComponent(id)}`);
  },

  restoreProduct(id: string): Promise<AdminProductDTO> {
    return api.post(`/api/admin/products/${encodeURIComponent(id)}/restore`, {});
  },

  duplicateProduct(id: string): Promise<AdminProductDTO> {
    return api.post(
      `/api/admin/products/${encodeURIComponent(id)}/duplicate`,
      {},
    );
  },

  bulkProducts(input: AdminProductBulk): Promise<AdminProductBulkResult> {
    return api.post('/api/admin/products/bulk', input);
  },

  async exportProductsCsv(): Promise<Blob> {
    const res = await fetch('/api/admin/products/export?format=csv', {
      credentials: 'include',
    });
    if (!res.ok) throw new AppError('INTERNAL', 'Export failed');
    return res.blob();
  },

  importProductsCsv(file: File): Promise<AdminCsvImportReport> {
    const fd = new FormData();
    fd.set('file', file);
    return api.postForm('/api/admin/products/import', fd);
  },

  listMedia(params: { page?: number; pageSize?: number; q?: string } = {}) {
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.pageSize) sp.set('pageSize', String(params.pageSize));
    if (params.q) sp.set('q', params.q);
    const q = sp.toString();
    return api.get<Paginated<AdminMediaDTO>>(
      `/api/admin/media${q ? `?${q}` : ''}`,
    );
  },

  uploadMedia(file: File, folder?: string): Promise<AdminMediaDTO> {
    const fd = new FormData();
    fd.set('file', file);
    if (folder) fd.set('folder', folder);
    return api.postForm('/api/admin/media', fd);
  },

  deleteMedia(id: string): Promise<{ ok: true }> {
    return api.del(`/api/admin/media/${encodeURIComponent(id)}`);
  },

  updateMediaAlt(id: string, alt: string | null): Promise<AdminMediaDTO> {
    return api.put(`/api/admin/media/${encodeURIComponent(id)}`, { alt });
  },

  uploadProductImages(id: string, files: File[]): Promise<AdminProductDTO> {
    const fd = new FormData();
    for (const f of files) fd.append('file', f);
    return api.postForm(
      `/api/admin/products/${encodeURIComponent(id)}/images`,
      fd,
    );
  },

  removeProductImage(id: string, url: string): Promise<AdminProductDTO> {
    return delWithBody(
      `/api/admin/products/${encodeURIComponent(id)}/images`,
      { url },
    );
  },

  adjustStock(
    id: string,
    input: AdminStockAdjust,
  ): Promise<AdminProductDTO> {
    return api.post(
      `/api/admin/products/${encodeURIComponent(id)}/stock`,
      input,
    );
  },

  listInventory(id: string): Promise<InventoryMovementDTO[]> {
    return api.get(
      `/api/admin/products/${encodeURIComponent(id)}/inventory`,
    );
  },

  listCategories(): Promise<AdminCategoryDTO[]> {
    return api.get('/api/admin/categories');
  },

  createCategory(input: AdminCategoryWrite): Promise<AdminCategoryDTO> {
    return api.post('/api/admin/categories', input);
  },

  updateCategory(
    slug: string,
    input: Partial<AdminCategoryWrite>,
  ): Promise<AdminCategoryDTO> {
    return api.put(
      `/api/admin/categories/${encodeURIComponent(slug)}`,
      input,
    );
  },

  deleteCategory(slug: string): Promise<{ ok: true }> {
    return api.del(`/api/admin/categories/${encodeURIComponent(slug)}`);
  },

  uploadCategoryImage(slug: string, file: File): Promise<AdminCategoryDTO> {
    const fd = new FormData();
    fd.set('file', file);
    return api.postForm(
      `/api/admin/categories/${encodeURIComponent(slug)}/image`,
      fd,
    );
  },
};
