import type { ComponentType } from 'react';
import { cn } from '@/shared/utils/cn';

export interface StatChipProps {
  label: string;
  value: string | number;
  delta?: number;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}

export function StatChip({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  className,
}: StatChipProps) {
  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;

  return (
    <div
      className={cn(
        'bg-surface-raised border border-border rounded-lg p-4 flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>{label}</span>
        {Icon && <Icon className="h-4 w-4 text-text-muted shrink-0" />}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="font-display text-2xl font-bold text-text-primary tracking-tight">
          {value}
        </span>
        {delta !== undefined && delta !== 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-(--radius)',
              isPositive && 'bg-status-success/10 text-status-success',
              isNegative && 'bg-status-error/10 text-status-error',
              !isPositive && !isNegative && 'bg-text-muted/10 text-text-muted'
            )}
          >
            <span aria-hidden="true">{isPositive ? '▲' : isNegative ? '▼' : ''}</span>
            {Math.abs(delta)}%
          </span>
        )}
      </div>

      {hint && (
        <p className="mt-1 text-[11px] text-text-muted">{hint}</p>
      )}
    </div>
  );
}
