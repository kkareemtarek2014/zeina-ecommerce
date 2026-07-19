import type { Metadata } from 'next';
import { AdminGuard } from '@/features/admin';
import { AdminShell } from '@/features/admin';
import { ToastProvider } from '@/shared/components/ui';

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s · Sqoosh Admin',
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AdminGuard>
        <AdminShell>{children}</AdminShell>
      </AdminGuard>
    </ToastProvider>
  );
}
