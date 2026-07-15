import {
  PayloadTooLargeError,
  ValidationError,
} from '@/server/http/errors';
import {
  MAX_DECODED_PIXELS,
  MAX_IMAGE_INPUT_BYTES,
  detectImageFormat,
  isRasterFormat,
} from '@/server/lib/image/formats';

export type ImageProcessProfile = 'product' | 'hero' | 'library';

export type ProcessedImage = {
  bytes: ArrayBuffer;
  width: number | null;
  height: number | null;
  mime: 'image/webp' | 'image/svg+xml';
  extension: 'webp' | 'svg';
  /** Original client filename (sanitized-ish for display). */
  filename: string;
};

const PROFILES: Record<
  ImageProcessProfile,
  { maxEdge: number; quality: number }
> = {
  product: { maxEdge: 2048, quality: 82 },
  hero: { maxEdge: 2560, quality: 85 },
  library: { maxEdge: 2048, quality: 82 },
};

function displayFilename(name: string, extension: string): string {
  const base = (name.split(/[/\\]/).pop() ?? 'upload').replace(/\.[^.]+$/, '');
  const cleaned =
    base.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 100).trim() || 'upload';
  return `${cleaned}.${extension}`;
}

/**
 * Magic-byte gate → (SVG passthrough | Images WebP pipeline).
 * Profiles control max edge + WebP quality. GIF/HEIC rejected.
 */
export async function processUpload(
  file: File,
  profile: ImageProcessProfile,
): Promise<ProcessedImage> {
  if (!file) throw new ValidationError('file is required');
  if (file.size > MAX_IMAGE_INPUT_BYTES) {
    throw new PayloadTooLargeError('Image must be smaller than 5 MB');
  }

  const input = await file.arrayBuffer();
  const bytes = new Uint8Array(input);
  const format = detectImageFormat(bytes);

  if (format === 'svg') {
    return {
      bytes: input,
      width: null,
      height: null,
      mime: 'image/svg+xml',
      extension: 'svg',
      filename: displayFilename(file.name || 'upload.svg', 'svg'),
    };
  }

  if (format === 'gif') {
    throw new ValidationError(
      'GIF uploads are not supported. Please upload JPEG, PNG, or WebP.',
    );
  }
  if (format === 'heic') {
    throw new ValidationError(
      'HEIC uploads are not supported. Please upload JPEG, PNG, or WebP.',
    );
  }
  if (!isRasterFormat(format)) {
    throw new ValidationError(
      'Unsupported image type. Upload JPEG, PNG, WebP, or SVG.',
    );
  }

  const { maxEdge, quality } = PROFILES[profile];
  const { encodeToWebp, readImageInfo } = await import(
    '@/server/lib/image/codecs'
  );

  const info = await readImageInfo(input);
  const pixels = info.width * info.height;
  if (!Number.isFinite(pixels) || pixels <= 0) {
    throw new ValidationError('Image has invalid dimensions');
  }
  if (pixels > MAX_DECODED_PIXELS) {
    throw new ValidationError(
      'Image resolution is too large. Please upload a smaller image.',
    );
  }

  const encoded = await encodeToWebp(input, { maxEdge, quality });

  return {
    bytes: encoded.bytes,
    width: encoded.width,
    height: encoded.height,
    mime: 'image/webp',
    extension: 'webp',
    filename: displayFilename(file.name || 'upload.webp', 'webp'),
  };
}
