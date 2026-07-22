import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface SectionCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: SectionCardProps) {
  const hasHeader = title || description || action;

  return (
    <section
      className={cn(
        'bg-surface-raised border border-border rounded-(--radius-lg) p-5',
        className
      )}
    >
      {hasHeader && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-text-primary">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-text-secondary">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
