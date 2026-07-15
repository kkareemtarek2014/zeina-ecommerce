'use client';

import {
  AdminBreadcrumbs,
  CronJobsPanel,
  useAdminSettings,
} from '@/features/admin';

export default function AdminCronPage() {
  const { data, isLoading, isError } = useAdminSettings();

  return (
    <div>
      <AdminBreadcrumbs
        items={[{ label: 'Admin', href: '/admin' }, { label: 'Cron jobs' }]}
      />
      <h1 className="font-display text-3xl font-semibold text-text-primary">
        Cron jobs
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        View automated job status and execute manual smoke test runs.
      </p>

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
