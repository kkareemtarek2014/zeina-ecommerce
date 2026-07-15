/**
 * Raster decode/resize/encode via Cloudflare Images binding (`env.IMAGES`).
 *
 * Spike note: `@jsquash/*` WASM default-imports fail under Next Turbopack /
 * OpenNext (`Export default doesn't exist in target module`). V1 therefore uses
 * the Images binding already configured in `wrangler.jsonc`, preserving the
 * same `processUpload` contract for all callers.
 */

import { getCloudflareEnv } from '@/server/db/request';
import { ValidationError } from '@/server/http/errors';

function bufferToStream(buffer: ArrayBuffer): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer));
      controller.close();
    },
  });
}

async function streamToArrayBuffer(
  stream: ReadableStream<Uint8Array>,
): Promise<ArrayBuffer> {
  return new Response(stream).arrayBuffer();
}

export type ImageInfo = {
  width: number;
  height: number;
  format: string;
  fileSize: number;
};

export async function readImageInfo(buffer: ArrayBuffer): Promise<ImageInfo> {
  const env = await getCloudflareEnv();
  if (!env.IMAGES) {
    throw new ValidationError('Image processing is unavailable');
  }
  try {
    const info = await env.IMAGES.info(bufferToStream(buffer));
    if (!('width' in info) || !('height' in info)) {
      throw new ValidationError(
        'Could not read image dimensions. The file may be corrupt or unsupported.',
      );
    }
    return {
      width: info.width,
      height: info.height,
      format: info.format,
      fileSize: info.fileSize,
    };
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError(
      'Could not decode image. The file may be corrupt or unsupported.',
    );
  }
}

/**
 * Resize (scale-down only) and encode to WebP using Cloudflare Images.
 * Returns final bytes plus post-transform dimensions.
 */
export async function encodeToWebp(
  buffer: ArrayBuffer,
  opts: { maxEdge: number; quality: number },
): Promise<{ bytes: ArrayBuffer; width: number; height: number }> {
  const env = await getCloudflareEnv();
  if (!env.IMAGES) {
    throw new ValidationError('Image processing is unavailable');
  }
  try {
    const result = await env.IMAGES.input(bufferToStream(buffer))
      .transform({
        width: opts.maxEdge,
        height: opts.maxEdge,
        fit: 'scale-down',
      })
      .output({
        format: 'image/webp',
        quality: opts.quality,
      });

    const bytes = await streamToArrayBuffer(result.image());
    const info = await env.IMAGES.info(bufferToStream(bytes));
    if (!('width' in info) || !('height' in info)) {
      throw new ValidationError('Failed to encode WebP image');
    }
    return {
      bytes,
      width: info.width,
      height: info.height,
    };
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError('Failed to process image into WebP');
  }
}
