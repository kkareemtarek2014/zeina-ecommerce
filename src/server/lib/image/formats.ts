/** Image byte sniffing + safety limits for the WebP pipeline. */

export type RasterImageFormat = 'jpeg' | 'png' | 'webp';
export type DetectedImageFormat = RasterImageFormat | 'svg' | 'gif' | 'heic' | 'unknown';

/** Reject decompression bombs before/after decode. ~40 megapixels. */
export const MAX_DECODED_PIXELS = 40_000_000;

/** Catalog / library upload ceiling (matches MAX_CATALOG_BYTES). */
export const MAX_IMAGE_INPUT_BYTES = 5 * 1024 * 1024;

export function detectImageFormat(bytes: Uint8Array): DetectedImageFormat {
  if (bytes.length < 3) return 'unknown';

  // JPEG SOI
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }

  // PNG signature
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }

  // GIF
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39)
  ) {
    return 'gif';
  }

  // WebP: RIFF....WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp';
  }

  // HEIC/HEIF brands in ftyp box
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(
      bytes[8] ?? 0,
      bytes[9] ?? 0,
      bytes[10] ?? 0,
      bytes[11] ?? 0,
    );
    if (
      brand === 'heic' ||
      brand === 'heix' ||
      brand === 'hevc' ||
      brand === 'mif1' ||
      brand === 'msf1'
    ) {
      return 'heic';
    }
  }

  // SVG: look for '<svg' / '<?xml' in the first chunk (UTF-8)
  const head = new TextDecoder()
    .decode(bytes.subarray(0, Math.min(bytes.length, 256)))
    .trimStart()
    .toLowerCase();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
    return 'svg';
  }

  return 'unknown';
}

export function isRasterFormat(format: DetectedImageFormat): format is RasterImageFormat {
  return format === 'jpeg' || format === 'png' || format === 'webp';
}
