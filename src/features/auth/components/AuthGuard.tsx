'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';
import { useSession } from '../hooks/useAuth';
import { useFeature } from '@/shared/contexts/FeatureContext';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { Loader } from '@/shared/components/ui/Loader';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthEnabled = useFeature('auth');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionChecked = useAuthStore((state) => state.sessionChecked);
  const hydrated = useHydrated();
  const router = useRouter();
  useSession();

  useEffect(() => {
    if (isAuthEnabled && hydrated && sessionChecked && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthEnabled, hydrated, sessionChecked, isAuthenticated, router]);

  if (!hydrated || !sessionChecked) {
    return <Loader fullscreen={false} className="p-12" />;
  }

  if (isAuthEnabled && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
