import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Truck,
  Users,
  MapPin,
  Ticket,
  Settings,
  Activity,
  ImageIcon,
  LayoutTemplate,
  Download,
  Layers,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/shared/rbac';

export interface NavItemConfig {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  permission: Permission;
  badgeKey?: 'orders';
  featureFlag?: string;
}

export interface NavGroupConfig {
  id: string;
  label: string;
  items: NavItemConfig[];
}

export const NAV_GROUPS: ReadonlyArray<NavGroupConfig> = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        icon: LayoutDashboard,
        exact: true,
        permission: 'dashboard:read',
      },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog',
    items: [
      {
        href: '/admin/products',
        label: 'Products',
        icon: Package,
        permission: 'products:read',
      },
      {
        href: '/admin/categories',
        label: 'Categories',
        icon: FolderTree,
        permission: 'categories:write',
      },
      {
        href: '/admin/bundles',
        label: 'Bundles',
        icon: Layers,
        permission: 'promos:write',
      },
      {
        href: '/admin/media',
        label: 'Media',
        icon: ImageIcon,
        permission: 'media:write',
      },
      {
        href: '/admin/import',
        label: 'Import',
        icon: Download,
        permission: 'products:write',
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    items: [
      {
        href: '/admin/orders',
        label: 'Orders',
        icon: ShoppingBag,
        permission: 'orders:read',
        badgeKey: 'orders',
      },
      {
        href: '/admin/shipments',
        label: 'Shipments',
        icon: Truck,
        permission: 'orders:read',
      },
      {
        href: '/admin/promos',
        label: 'Promos',
        icon: Ticket,
        permission: 'promos:write',
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    items: [
      {
        href: '/admin/users',
        label: 'Users',
        icon: Users,
        permission: 'users:read',
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        href: '/admin/homepage',
        label: 'Homepage',
        icon: LayoutTemplate,
        permission: 'homepage:write',
        featureFlag: 'homepage_builder',
      },
      {
        href: '/admin/locations',
        label: 'Locations',
        icon: MapPin,
        permission: 'locations:write',
      },
      {
        href: '/admin/activity',
        label: 'Activity log',
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
    ],
  },
];
