/**
 * Code-config RBAC (Phase 21). No `role_permissions` table.
 */

export const USER_ROLES = [
  'customer',
  'admin',
  'manager',
  'order_manager',
  'product_manager',
  'content_manager',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Roles that may enter `/admin/**`. */
export const STAFF_ROLES = [
  'admin',
  'manager',
  'order_manager',
  'product_manager',
  'content_manager',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const PERMISSIONS = [
  'dashboard:read',
  'products:read',
  'products:write',
  'categories:write',
  'media:write',
  'orders:read',
  'orders:write',
  'users:read',
  'users:write',
  'locations:write',
  'promos:write',
  'homepage:write',
  'settings:write',
  'activity:read',
  'notifications:read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL_PERMISSIONS: Permission[] = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  customer: [],
  admin: ALL_PERMISSIONS,
  manager: ALL_PERMISSIONS.filter(
    (p) => p !== 'settings:write' && p !== 'users:write',
  ),
  order_manager: [
    'dashboard:read',
    'orders:read',
    'orders:write',
    'notifications:read',
    'activity:read',
  ],
  product_manager: [
    'dashboard:read',
    'products:read',
    'products:write',
    'categories:write',
    'media:write',
    'notifications:read',
    'activity:read',
  ],
  content_manager: [
    'dashboard:read',
    'promos:write',
    'media:write',
    'categories:write',
    'homepage:write',
    'notifications:read',
    'activity:read',
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  admin: 'Admin',
  manager: 'Manager',
  order_manager: 'Order manager',
  product_manager: 'Product manager',
  content_manager: 'Content manager',
};

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export function isUserRole(role: string): role is UserRole {
  return (USER_ROLES as readonly string[]).includes(role);
}

export function hasPermission(role: string, permission: Permission): boolean {
  if (!isUserRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(
  role: string,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/** Admin UI route → required permission (prefix match, longest first). */
export const ADMIN_ROUTE_PERMISSIONS: ReadonlyArray<{
  prefix: string;
  permission: Permission;
}> = [
  { prefix: '/admin/products', permission: 'products:read' },
  { prefix: '/admin/import', permission: 'products:write' },
  { prefix: '/admin/media', permission: 'media:write' },
  { prefix: '/admin/categories', permission: 'categories:write' },
  { prefix: '/admin/orders', permission: 'orders:read' },
  { prefix: '/admin/shipments', permission: 'orders:read' },
  { prefix: '/admin/users', permission: 'users:read' },
  { prefix: '/admin/locations', permission: 'locations:write' },
  { prefix: '/admin/promos', permission: 'promos:write' },
  { prefix: '/admin/bundles', permission: 'promos:write' },
  { prefix: '/admin/homepage', permission: 'homepage:write' },
  { prefix: '/admin/activity', permission: 'activity:read' },
  { prefix: '/admin/cron', permission: 'settings:write' },
  { prefix: '/admin/settings', permission: 'settings:write' },
  { prefix: '/admin', permission: 'dashboard:read' },
];

export function permissionForAdminPath(pathname: string): Permission | null {
  const path = pathname.split('?')[0] ?? pathname;
  if (path === '/admin/login' || path === '/admin/forbidden') return null;
  for (const row of ADMIN_ROUTE_PERMISSIONS) {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.permission;
    }
  }
  return 'dashboard:read';
}
