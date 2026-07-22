'use client';

import {
  AdminPageHeader,
  CronJobsPanel,
  useAdminSettings,
} from '@/features/admin';

export default function AdminCronPage() {
  const { data, isLoading, isError } = useAdminSettings();

  return (
    <div>
      <AdminPageHeader
        title="Cron jobs"
        subtitle="View automated job status and execute manual smoke test runs."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Cron jobs' }]}
      />

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : isError || !data ? (
          <p className="text-sm text-status-error">Failed to load job status.</p>
        ) : (
          <CronJobsPanel lastRuns={data.cronLastRuns} />
        )}
      </div>
    </div>
  );
}
