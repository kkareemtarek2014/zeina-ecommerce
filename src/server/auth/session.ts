import 'server-only';

export const SESSION_COOKIE = 'sqoosh_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Opaque raw token for the cookie (32 random bytes, base64url). */
export function generateSessionToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

/** SHA-256 hex of the raw token — stored as sessions.id. */
export async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  );
  return toHex(digest);
}

export function sessionExpiryDate(from = new Date()): Date {
  return new Date(from.getTime() + SESSION_TTL_MS);
}

export function readSessionToken(request: Request): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === SESSION_COOKIE) {
      const value = rest.join('=').trim();
      return value || null;
    }
  }
  return null;
}

function cookieSecure(request: Request): boolean {
  return new URL(request.url).protocol === 'https:';
}

export function buildSessionCookie(
  request: Request,
  token: string,
  expiresAt: Date,
): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${expiresAt.toUTCString()}`,
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (cookieSecure(request)) parts.push('Secure');
  return parts.join('; ');
}

export function buildClearSessionCookie(request: Request): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];
  if (cookieSecure(request)) parts.push('Secure');
  return parts.join('; ');
}
