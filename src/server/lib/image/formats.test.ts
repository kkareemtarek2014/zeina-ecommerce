import { describe, expect, it } from 'vitest';
import {
  detectImageFormat,
  isRasterFormat,
  MAX_DECODED_PIXELS,
} from '@/server/lib/image/formats';

/** 1×1 PNG */
const PNG_1X1 = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  ),
);

/** Minimal JPEG SOI + APP0-ish (enough for magic sniff; may not decode) */
const JPEG_SOI = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

const GIF_HEADER = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

const WEBP_HEADER = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

const SVG_SNIPPET = new TextEncoder().encode(
  '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>',
);

describe('detectImageFormat', () => {
  it('detects png/jpeg/webp/gif/svg', () => {
    expect(detectImageFormat(PNG_1X1)).toBe('png');
    expect(detectImageFormat(JPEG_SOI)).toBe('jpeg');
    expect(detectImageFormat(WEBP_HEADER)).toBe('webp');
    expect(detectImageFormat(GIF_HEADER)).toBe('gif');
    expect(detectImageFormat(SVG_SNIPPET)).toBe('svg');
  });

  it('marks raster formats', () => {
    expect(isRasterFormat('jpeg')).toBe(true);
    expect(isRasterFormat('svg')).toBe(false);
    expect(isRasterFormat('gif')).toBe(false);
  });

  it('exposes a finite decoded-pixel ceiling', () => {
    expect(MAX_DECODED_PIXELS).toBeGreaterThan(1_000_000);
  });
});
