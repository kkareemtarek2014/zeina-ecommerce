import Link from 'next/link';
import type { ComponentType } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface ActionCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  href: string;
  cta: string;
  className?: string;
}

export function ActionCard({
  icon: Icon,
  title,
  count,
  href,
  cta,
  className,
}: ActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group block bg-surface-raised border border-border rounded-lg p-4 shadow-2xs hover:border-brand-primary/40 transition-all animate-fade-up',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius) bg-brand-blush text-brand-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-text-primary group-hover:text-brand-primary transition-colors">
                {title}
              </h3>
              {count !== undefined && count > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-brand-accent px-2 py-0.5 text-xs font-bold text-white animate-pop">
                  {count}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary group-hover:translate-x-0.5 transition-transform">
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
