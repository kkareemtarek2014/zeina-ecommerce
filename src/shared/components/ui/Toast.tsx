'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type ToastTone = 'default' | 'success' | 'error';

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'default') => {
      const id = crypto.randomUUID();
      setItems((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto animate-fade-up flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-md',

              item.tone === 'success' &&
                'border-status-success/30 bg-surface-raised text-status-success',
              item.tone === 'error' &&
                'border-status-error/30 bg-surface-raised text-status-error',
              item.tone === 'default' &&
                'border-border bg-surface-raised text-text-primary',
            )}
          >
            <p className="flex-1">{item.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              className="text-text-muted hover:text-text-primary"
              onClick={() => dismiss(item.id)}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
