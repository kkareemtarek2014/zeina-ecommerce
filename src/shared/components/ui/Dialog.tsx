'use client';

import {
  useEffect,
  useId,
  type ReactNode,
  type MouseEvent,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from './Button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  /** Footer actions (e.g. Cancel / Confirm) */
  footer?: ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
  footer,
}: DialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={onBackdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'animate-fade-up w-full max-w-md rounded-lg border border-border bg-surface-raised p-5 shadow-lg',

          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="font-(family-name:--font-display) text-xl font-semibold text-text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="text-text-muted transition-colors hover:text-text-primary"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-4 text-sm text-text-secondary">{children}</div>
        {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={danger ? 'primary' : 'primary'}
            isLoading={isLoading}
            className={danger ? 'bg-status-error hover:bg-status-error/90' : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{description}</p>
    </Dialog>
  );
}
