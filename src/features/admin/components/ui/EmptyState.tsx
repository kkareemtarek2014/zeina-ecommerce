import Link from 'next/link';
import { cn } from '@/shared/utils/cn';

export interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyState({
  emoji = '✨',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-surface-raised border border-border rounded-lg',
        className
      )}
    >
      <span className="text-4xl mb-3" role="img" aria-hidden="true">
        {emoji}
      </span>
      <h3 className="text-base font-semibold text-text-primary mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-text-secondary max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center justify-center rounded-(--radius) bg-brand-primary text-text-inverse hover:bg-brand-secondary h-9 px-4 text-sm font-medium tracking-wide transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
