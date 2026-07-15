import 'server-only';

/**
 * Storefront/admin server entry for the WebP upload pipeline.
 * Implementation lives in `lib/image/process-upload` so unit tests can import
 * without pulling `server-only`.
 */
export {
  processUpload,
  type ImageProcessProfile,
  type ProcessedImage,
} from '@/server/lib/image/process-upload';
