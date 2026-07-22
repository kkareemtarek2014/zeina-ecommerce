'use client';

import Link from 'next/link';
import {
  Store,
  Truck,
  Percent,
  BadgeCheck,
  Search,
  LayoutDashboard,
} from 'lucide-react';
import { AdminPageHeader } from '@/features/admin';

const tiles = [
  {
    href: '/admin/settings/store',
    title: 'Store',
    description: 'Branding, contact & social links',
    icon: Store,
  },
  {
    href: '/admin/settings/shipping',
    title: 'Shipping',
    description: 'ETA hints and free-shipping threshold',
    icon: Truck,
  },
  {
    href: '/admin/settings/pricing',
    title: 'Pricing',
    description: 'Profit margin, landed-cost engine & rounding',
    icon: Percent,
  },
  {
    href: '/admin/settings/integrations',
    title: 'Integrations',
    description:
      'Paymob/Bosta health, Temu kill switch, cron timing',
    icon: BadgeCheck,
  },
  {
    href: '/admin/settings/seo',
    title: 'SEO',
    description: 'Default titles, descriptions, footer text',
    icon: Search,
  },
] as const;

export default function AdminSettingsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Settings"
        subtitle="Configure your storefront defaults and integrations."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Settings' },
        ]}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="block">
            <div className="h-full rounded-lg border border-border bg-surface-raised p-5 transition-colors hover:border-brand-primary/40">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <t.icon className="mt-0.5 size-4 text-brand-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {t.title}
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary">
                      {t.description}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-brand-primary hover:underline">
                  Open
                </span>
              </div>
            </div>
          </Link>
        ))}
        <div className="sm:col-span-2 lg:col-span-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-brand-primary"
          >
            <LayoutDashboard className="size-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

