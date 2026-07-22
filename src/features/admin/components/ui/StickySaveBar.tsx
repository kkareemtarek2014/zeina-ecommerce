'use client';

import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';

export interface StickySaveBarProps {
  isDirty: boolean;
  isSubmitting?: boolean;
  onDiscard?: () => void;
  submitLabel?: string;
  discardLabel?: string;
  className?: string;
}

export function StickySaveBar({
  isDirty,
  isSubmitting = false,
  onDiscard,
  submitLabel = 'Save changes',
  discardLabel = 'Discard',
  className,
}: StickySaveBarProps) {
  if (!isDirty) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-surface-raised border border-border shadow-lg rounded-full px-5 py-2.5 animate-fade-up max-w-[90vw]',
        className
      )}
    >
      <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
        Unsaved changes
      </span>

      <div className="h-4 w-px bg-border shrink-0" aria-hidden="true" />

      <div className="flex items-center gap-2">
        {onDiscard && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDiscard}
            disabled={isSubmitting}
            className="rounded-full text-xs"
          >
            {discardLabel}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="rounded-full text-xs font-semibold"
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
