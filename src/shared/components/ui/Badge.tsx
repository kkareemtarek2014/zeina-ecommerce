import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

type Tone = 'accent' | 'primary' | 'muted' | 'success' | 'warning' | 'error';

const toneClasses: Record<Tone, string> = {
  accent: 'bg-brand-accent/15 text-brand-accent',
  primary: 'bg-brand-primary/10 text-brand-primary',
  muted: 'bg-border text-text-secondary',
  success: 'bg-status-success/10 text-status-success',
  warning: 'bg-status-warning/15 text-status-warning',
  error: 'bg-status-error/10 text-status-error',
};

export function Badge({
  tone = 'primary',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
