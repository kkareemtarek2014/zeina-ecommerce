'use client';

import { AdminPageHeader, HomepageBuilder } from '@/features/admin';

export default function AdminHomepagePage() {
  return (
    <div>
      <AdminPageHeader
        title="Homepage builder"
        subtitle="Manage home page blocks and featured collections."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Homepage' },
        ]}
      />
      <HomepageBuilder />
    </div>
  );
}
