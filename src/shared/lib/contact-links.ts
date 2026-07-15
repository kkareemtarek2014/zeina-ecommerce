/**
 * Shared storefront contact / social link helpers (server + client safe).
 */

/** Digits-only WhatsApp id for wa.me; returns null when empty/invalid. */
export function normalizeWhatsAppDigits(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

/** True for absolute https URLs only (no protocol-relative / javascript / data). */
export function isHttpsUrl(raw: string | null | undefined): raw is string {
  if (!raw?.trim()) return false;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Resolve metadataBase / OG base; falls back when the configured URL is invalid. */
export function resolveSiteUrl(
  configured: string | null | undefined,
  fallback: string,
): string {
  const candidate = configured?.trim() || fallback;
  try {
    return new URL(candidate).toString();
  } catch {
    return new URL(fallback).toString();
  }
}
