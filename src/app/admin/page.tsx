import type { Metadata } from 'next';
import { DashboardView } from '@/features/admin';

export const metadata: Metadata = { title: 'Dashboard' };

export default function AdminHomePage() {
  return <DashboardView />;
}
