import 'server-only';
import {
  bridalRequestFieldsSchema,
  type BridalRequestResponse,
} from '@/shared/contracts/bridal.contract';
import { getRequestDb } from '@/server/db/request';
import {
  PayloadTooLargeError,
  ValidationError,
} from '@/server/http/errors';
import * as bridalRepo from '@/server/repositories/bridal-requests.repo';
import {
  MAX_BRIDAL_BYTES,
  putBridalUpload,
} from '@/server/services/upload.service';

function generateBridalId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
  return `BR-${stamp}-${random}`;
}

function formString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v : '';
}

export async function createBridalRequestFromForm(
  formData: FormData,
  userId: string | null,
): Promise<BridalRequestResponse> {
  const parsed = bridalRequestFieldsSchema.safeParse({
    fullName: formString(formData, 'fullName'),
    phone: formString(formData, 'phone'),
    weddingDate: formString(formData, 'weddingDate') || undefined,
    description: formString(formData, 'description'),
  });
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }

  const rawFile = formData.get('file');
  const file =
    rawFile instanceof File && rawFile.size > 0 ? rawFile : undefined;

  if (file) {
    if (file.size > MAX_BRIDAL_BYTES) {
      throw new PayloadTooLargeError('File must be smaller than 25 MB');
    }
    const type = file.type || '';
    if (!type.startsWith('image/') && !type.startsWith('video/')) {
      throw new ValidationError('Only photos or videos are accepted');
    }
    // Reject SVG (script-carrying vector) from untrusted public uploads.
    if (type === 'image/svg+xml') {
      throw new ValidationError('SVG files are not accepted');
    }
  }

  const id = generateBridalId();
  const now = new Date();
  let fileKey: string | null = null;
  let fileName: string | null = null;
  let fileType: string | null = null;

  if (file) {
    try {
      const uploaded = await putBridalUpload(id, file);
      fileKey = uploaded.key;
      fileName = uploaded.fileName;
      fileType = uploaded.fileType;
    } catch (err) {
      if (err instanceof Error && err.message.includes('size limit')) {
        throw new PayloadTooLargeError('File must be smaller than 25 MB');
      }
      throw err;
    }
  }

  const weddingDate =
    parsed.data.weddingDate && parsed.data.weddingDate.trim() !== ''
      ? parsed.data.weddingDate.trim()
      : null;

  const db = await getRequestDb();
  const row = await bridalRepo.createBridalRequest(db, {
    id,
    userId,
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    weddingDate,
    description: parsed.data.description,
    fileKey,
    fileName,
    fileType,
    createdAt: now,
  });

  return {
    id: row.id,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
