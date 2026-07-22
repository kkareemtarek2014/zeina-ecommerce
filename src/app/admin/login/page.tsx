import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminLoginForm } from '@/features/admin';
import { Loader } from '@/shared/components/ui';

export const metadata: Metadata = { title: 'Admin Login' };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface-raised p-8 shadow-sm">
        <h1 className="font-(family-name:--font-display) text-3xl font-semibold text-brand-primary italic">
          Sqoosh Admin
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Sign in with an admin account to manage the store.
        </p>
        <div className="mt-6">
          <Suspense fallback={<Loader fullscreen={false} className="p-8" />}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
