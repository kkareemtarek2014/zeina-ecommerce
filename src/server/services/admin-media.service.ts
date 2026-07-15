import 'server-only';
import type {
  AdminMediaDTO,
  Paginated,
} from '@/shared/contracts/admin-catalog.contract';
import { adminMediaAltUpdateSchema } from '@/shared/contracts/admin-catalog.contract';
import { getRequestDb } from '@/server/db/request';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import * as mediaRepo from '@/server/repositories/media.repo';
import {
  deleteUploadObject,
  uploadProcessedCatalogImage,
} from '@/server/services/upload.service';

function toDto(row: mediaRepo.MediaAssetRow): AdminMediaDTO {
  const dto: AdminMediaDTO = {
    id: row.id,
    url: row.url,
    filename: row.filename,
    mime: row.mime,
    size: row.size,
    width: row.width,
    height: row.height,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt.toISOString(),
  };
  if (row.alt) dto.alt = row.alt;
  if (row.folder) dto.folder = row.folder;
  return dto;
}

export async function listAdminMedia(url: URL): Promise<Paginated<AdminMediaDTO>> {
  const page = Number(url.searchParams.get('page') ?? '1') || 1;
  const pageSize = Number(url.searchParams.get('pageSize') ?? '24') || 24;
  const q = url.searchParams.get('q') ?? undefined;
  const db = await getRequestDb();
  const { rows, total } = await mediaRepo.listMedia(db, { page, pageSize, q });
  return {
    items: rows.map(toDto),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function uploadAdminMedia(
  file: File,
  uploadedBy: string,
  folder?: string,
): Promise<AdminMediaDTO> {
  if (!file) throw new ValidationError('file is required');
  const folderKey = folder?.trim() || 'library';
  const uploaded = await uploadProcessedCatalogImage(folderKey, file, 'library');
  const db = await getRequestDb();
  const id = `med_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const row = await mediaRepo.insertMedia(db, {
    id,
    r2Key: uploaded.key,
    url: uploaded.url,
    filename: uploaded.filename,
    mime: uploaded.mime,
    size: uploaded.size,
    width: uploaded.width,
    height: uploaded.height,
    alt: null,
    folder: folderKey,
    uploadedBy,
    createdAt: new Date(),
  });
  return toDto(row);
}

export async function updateAdminMediaAlt(
  id: string,
  raw: unknown,
): Promise<AdminMediaDTO> {
  const parsed = adminMediaAltUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  const db = await getRequestDb();
  const existing = await mediaRepo.findMediaById(db, id);
  if (!existing) throw new NotFoundError('Media not found');
  const row = await mediaRepo.updateMediaAlt(db, id, parsed.data.alt);
  if (!row) throw new NotFoundError('Media not found');
  return toDto(row);
}

export async function deleteAdminMedia(id: string): Promise<{ ok: true }> {
  const db = await getRequestDb();
  const existing = await mediaRepo.findMediaById(db, id);
  if (!existing) throw new NotFoundError('Media not found');

  const referenced = await mediaRepo.isMediaUrlReferenced(db, existing.url);
  if (referenced) {
    throw new ConflictError(
      'Cannot delete media still used by a product or category',
    );
  }

  await deleteUploadObject(existing.r2Key).catch(() => undefined);
  await mediaRepo.deleteMedia(db, id);
  return { ok: true };
}
