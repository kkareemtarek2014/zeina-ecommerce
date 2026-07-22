import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface FilterBarProps {
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function FilterBar({
  leftSlot,
  rightSlot,
  children,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-surface-raised border border-border rounded-(--radius-lg) p-3',
        className
      )}
    >
      {children ? (
        children
      ) : (
        <>
          {leftSlot && <div className="flex-1 min-w-[200px]">{leftSlot}</div>}
          {rightSlot && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {rightSlot}
            </div>
          )}
        </>
      )}
    </div>
  );
}
