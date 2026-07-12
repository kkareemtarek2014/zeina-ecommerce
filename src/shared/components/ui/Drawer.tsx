'use client';

import { useRef, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { useScrollLock } from '@/shared/hooks/useScrollLock';
import { useEscapeKey } from '@/shared/hooks/useEscapeKey';
import { useHydrated } from '@/shared/hooks/useHydrated';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Right-side slide-in panel (bottom sheet feel on mobile widths is kept
 * simple: full-width panel). Portal to body, focus trap, scroll lock, Esc.
 */
export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const mounted = useHydrated();

  useFocusTrap(containerRef, isOpen);
  useScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-surface-overlay/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Panel */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface-raised shadow-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2
            id={titleId}
            className="font-display text-xl font-semibold"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-brand-blush hover:text-brand-primary"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
