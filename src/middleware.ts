import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { FEATURES } from '@/config/features.config';

const SESSION_COOKIE = 'sqoosh_session';

function isMaintenanceBypass(pathname: string): boolean {
  if (pathname.startsWith('/admin')) return true;
  if (pathname.startsWith('/api')) return true;
  if (pathname === '/maintenance' || pathname.startsWith('/maintenance/'))
    return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/images')) return true;
  return false;
}

async function isMaintenanceOn(request: NextRequest): Promise<boolean> {
  try {
    const url = new URL('/api/storefront-config', request.url);
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const body = (await res.json()) as {
      data?: { maintenanceMode?: boolean };
    };
    return Boolean(body.data?.maintenanceMode);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin cookie gate (Edge — role checked in AdminGuard / requireAdmin)
  if (pathname.startsWith('/admin')) {
    const isPublic =
      pathname === '/admin/login' || pathname.startsWith('/admin/login/');
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    if (!isPublic && !hasSession) {
      const login = new URL('/admin/login', request.url);
      login.searchParams.set('redirect', pathname);
      return NextResponse.redirect(login);
    }
  }

  if (!isMaintenanceBypass(pathname)) {
    const on = await isMaintenanceOn(request);
    if (on) {
      return NextResponse.rewrite(new URL('/maintenance', request.url));
    }
  }

  for (const feature of Object.values(FEATURES)) {
    if (!feature.enabled && feature.routes) {
      const isRouteDisabled = feature.routes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      );

      if (isRouteDisabled) {
        return NextResponse.rewrite(new URL('/_feature-disabled', request.url), {
          status: 404,
        });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
