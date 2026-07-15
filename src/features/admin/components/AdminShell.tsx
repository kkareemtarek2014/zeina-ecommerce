'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Truck,
  Users,
  MapPin,
  Ticket,
  Heart,
  Settings,
  Menu,
  X,
  LogOut,
  Activity,
  ImageIcon,
  LayoutTemplate,
  Download,
  Layers,
  Clock,
  Globe,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui';
import { NotificationBell } from './NotificationBell';
import {
  hasPermission,
  ROLE_LABELS,
  type Permission,
} from '@/shared/rbac';

const NAV: ReadonlyArray<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  permission: Permission;
}> = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
    permission: 'dashboard:read',
  },
  {
    href: '/admin/products',
    label: 'Products',
    icon: Package,
    permission: 'products:read',
  },
  {
    href: '/admin/import',
    label: 'Temu import',
    icon: Download,
    permission: 'products:write',
  },
  {
    href: '/admin/media',
    label: 'Media',
    icon: ImageIcon,
    permission: 'media:write',
  },
  {
    href: '/admin/categories',
    label: 'Categories',
    icon: FolderTree,
    permission: 'categories:write',
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: ShoppingBag,
    permission: 'orders:read',
  },
  {
    href: '/admin/shipments',
    label: 'Shipments',
    icon: Truck,
    permission: 'orders:read',
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
    permission: 'users:read',
  },
  {
    href: '/admin/locations',
    label: 'Locations',
    icon: MapPin,
    permission: 'locations:write',
  },
  {
    href: '/admin/promos',
    label: 'Promos',
    icon: Ticket,
    permission: 'promos:write',
  },
  {
    href: '/admin/bundles',
    label: 'Bundles',
    icon: Layers,
    permission: 'promos:write',
  },
  {
    href: '/admin/bridal',
    label: 'Bridal',
    icon: Heart,
    permission: 'bridal:write',
  },
  {
    href: '/admin/homepage',
    label: 'Homepage',
    icon: LayoutTemplate,
    permission: 'homepage:write',
  },
  {
    href: '/admin/activity',
    label: 'Activity',
    icon: Activity,
    permission: 'activity:read',
  },
  {
    href: '/admin/cron',
    label: 'Cron jobs',
    icon: Clock,
    permission: 'settings:write',
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    permission: 'settings:write',
  },
];

function navActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** CMS-facing admin routes (storefront-visible content editors). */
const CMS_ROUTE_PREFIXES = [
  '/admin/settings',
  '/admin/homepage',
  '/admin/media',
] as const;

function isCmsAdminRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return CMS_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function CmsModeBadge() {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-40 rounded-md border border-amber-700/40 bg-amber-50/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-900 shadow-sm"
      aria-hidden
    >
      CMS · Content Editor
    </div>
  );
}

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const items = NAV.filter(
    (item) => user && hasPermission(user.role, item.permission),
  );

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface-raised transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link
            href="/admin"
            className="font-display text-xl font-bold italic text-brand-primary"
            onClick={onClose}
          >
            Zaya Admin
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            className="text-text-muted lg:hidden"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin">
          {items.map((item) => {
            const Icon = item.icon;
            const active = navActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-(--radius) px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-brand-blush text-brand-primary font-medium'
                    : 'text-text-secondary hover:bg-brand-blush/50 hover:text-text-primary',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur">
      <button
        type="button"
        aria-label="Open menu"
        className="text-text-primary lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="size-5" />
      </button>
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
      >
        <Globe className="size-3.5" />
        <span className="hidden sm:inline">View Website</span>
        <span className="sm:hidden">Website</span>
      </Link>
      <div className="flex-1" />
      {user && hasPermission(user.role, 'notifications:read') ? (
        <NotificationBell />
      ) : null}
      <div className="hidden text-right sm:block">
        <p className="text-sm text-text-secondary">
          {user?.name ?? user?.email}
        </p>
        {user ? (
          <p className="text-xs text-text-muted">
            {ROLE_LABELS[user.role] ?? user.role}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Sign out"
        isLoading={logout.isPending}
        onClick={() => {
          logout.mutate(undefined, {
            onSuccess: () => router.replace('/admin/login'),
          });
        }}
      >
        <LogOut className="size-4" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </header>
  );
}

export function AdminBreadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden>/</span> : null}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-brand-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-text-primary">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const bare = pathname === '/admin/login' || pathname === '/admin/forbidden';

  if (bare) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMenuClick={() => setOpen(true)} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
      {isCmsAdminRoute(pathname) ? <CmsModeBadge /> : null}
    </div>
  );
}
