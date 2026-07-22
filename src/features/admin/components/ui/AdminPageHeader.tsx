import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  subtitle,
  breadcrumbs,
  action,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            {breadcrumbs.map((item, i) => (
              <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden>/</span>}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="hover:text-brand-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-text-primary font-medium">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
