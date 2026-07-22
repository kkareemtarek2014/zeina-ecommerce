'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Globe,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Grid,
} from 'lucide-react';
import { useState, useEffect, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui';
import { NotificationBell } from './NotificationBell';
import {
  hasPermission,
  ROLE_LABELS,
} from '@/shared/rbac';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { isFeatureEnabled, type FeatureKey } from '@/config/features.config';
import { NAV_GROUPS } from '../config/nav.config';
import { useOrdersNeedingAction } from '../hooks/useAdminOps';

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
      className="pointer-events-none fixed bottom-16 lg:bottom-4 right-4 z-40 rounded-md border border-amber-700/40 bg-amber-50/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-900 shadow-sm"
      aria-hidden
    >
      CMS · Content Editor
    </div>
  );
}

const STORAGE_KEY = 'sqoosh-admin-nav';

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useHydrated();
  const ordersCount = useOrdersNeedingAction();

  // Store collapsed group IDs initialized from localStorage
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });


  const toggleGroup = (groupId: string) => {
    const updated = {
      ...collapsedGroups,
      [groupId]: !collapsedGroups[groupId],
    };
    setCollapsedGroups(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore write errors
    }
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden cursor-pointer"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-admin-sidebar text-admin-sidebar-text transition-transform lg:static lg:translate-x-0 border-r border-white/5',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <Link
            href="/admin"
            className="font-display text-xl font-bold italic text-brand-primary hover:opacity-90 transition-opacity"
            onClick={onClose}
          >
            Sqoosh Admin
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            className="text-admin-sidebar-text hover:text-white lg:hidden cursor-pointer"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3 custom-scrollbar" aria-label="Admin">
          {NAV_GROUPS.map((group) => {
            const filteredItems = group.items.filter((item) => {
              if (item.featureFlag && !isFeatureEnabled(item.featureFlag as FeatureKey)) {
                return false;
              }
              return user && hasPermission(user.role, item.permission);
            });

            if (filteredItems.length === 0) return null;
            const isCollapsed = isHydrated && Boolean(collapsedGroups[group.id]);

            return (
              <div key={group.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-admin-sidebar-text/60 hover:text-admin-sidebar-text transition-colors cursor-pointer"
                  aria-expanded={!isCollapsed}
                  aria-controls={`nav-group-${group.id}`}
                >
                  <span>{group.label}</span>
                  {isCollapsed ? (
                    <ChevronRight className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                </button>

                {!isCollapsed && (
                  <div id={`nav-group-${group.id}`} className="space-y-0.5">
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      const active = navActive(pathname, item.href, item.exact);
                      const isOrdersItem = item.badgeKey === 'orders';
                      const badgeValue = isOrdersItem ? ordersCount : 0;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-3 rounded-(--radius) px-3 py-2 text-sm transition-colors font-medium',
                            active
                              ? 'bg-admin-sidebar-active text-white shadow-xs'
                              : 'text-admin-sidebar-text hover:bg-white/5 hover:text-white',
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                          {badgeValue > 0 && (
                            <span
                              className="inline-flex items-center justify-center rounded-full bg-brand-accent px-1.5 py-0.5 text-[11px] font-bold text-white leading-none animate-pop"
                              title={`${badgeValue} orders need action`}
                            >
                              {badgeValue}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
        className="text-text-primary lg:hidden cursor-pointer"
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
        <p className="text-sm font-medium text-text-primary">
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

export function MobileBottomNav({ onOpenMore }: { onOpenMore: () => void }) {
  const pathname = usePathname();
  const ordersCount = useOrdersNeedingAction();

  const mobileTabs = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: ordersCount },
    { href: '/admin/products', label: 'Products', icon: Package },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Admin Nav"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-white/10 bg-admin-sidebar px-2 text-admin-sidebar-text lg:hidden"
    >
      {mobileTabs.map((tab) => {
        const Icon = tab.icon;
        const active = navActive(pathname, tab.href, tab.exact);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-[11px] font-medium transition-colors',
              active ? 'text-white' : 'text-admin-sidebar-text hover:text-white'
            )}
          >
            <div className="relative">
              <Icon className="size-5" />
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[9px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenMore}
        aria-label="Open full admin menu"
        className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-[11px] font-medium text-admin-sidebar-text hover:text-white cursor-pointer"
      >
        <Grid className="size-5" />
        <span>More</span>
      </button>
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const bare = pathname === '/admin/login' || pathname === '/admin/forbidden';
  const ordersCount = useOrdersNeedingAction();

  // Document title prefix (n) on /admin when orders need action
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (ordersCount > 0) {
      document.title = `(${ordersCount}) Sqoosh Admin`;
    } else {
      document.title = 'Sqoosh Admin';
    }
  }, [ordersCount]);

  if (bare) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col pb-14 lg:pb-0">
        <AdminTopbar onMenuClick={() => setOpen(true)} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
      <MobileBottomNav onOpenMore={() => setOpen(true)} />
      {isCmsAdminRoute(pathname) ? <CmsModeBadge /> : null}
    </div>
  );
}
