import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[75vh] bg-surface py-10 md:py-16 lg:py-20">
      {children}
    </div>
  );
}
