/**
 * Phase 1 spike — WebP stills pipeline
 *
 * ## Attempted: `@jsquash/{jpeg,png,webp,resize}`
 * Static `.wasm` default imports fail under Next.js 16 Turbopack / OpenNext with:
 * `Export default doesn't exist in target module` (and related module graph errors).
 * This blocks a production Worker build before runtime measurement is possible.
 * Result: **no-go for jSquash WASM in this stack for V1.**
 *
 * ## Shipped: Cloudflare Images binding (`env.IMAGES`)
 * Already configured in `wrangler.jsonc`. Same public contract:
 * `processUpload(file, profile)` → WebP (or SVG passthrough).
 *
 * Pipeline: magic-byte gate → `IMAGES.info` → pixel ceiling →
 * `transform({ width, height, fit: 'scale-down' })` → `output({ format: 'image/webp' })`.
 * Cloudflare Images applies EXIF orientation during decode.
 *
 * Profiles (unchanged from plan):
 * | product | 2048 | q82 |
 * | hero    | 2560 | q85 |
 * | library | 2048 | q82 |
 *
 * Callers share `uploadProcessedCatalogImage` — no forked upload paths.
 * Temu remote import + bridal attachments remain untouched in V1.
 *
 * No Wrangler `rules` / WASM entries were required.
 */

export const IMAGE_PIPELINE_SPIKE = {
  attempted: '@jsquash/*',
  shipped: 'cloudflare-images-binding',
  go: true,
  profiles: {
    product: { maxEdge: 2048, quality: 82 },
    hero: { maxEdge: 2560, quality: 85 },
    library: { maxEdge: 2048, quality: 82 },
  },
} as const;
