'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export type TabsVariant = 'line' | 'pills' | 'segmented';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  defaultValue: string;
  /** Controlled active tab. When set, pair with `onValueChange`. */
  value?: string;
  variant?: TabsVariant;
  children: ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  variant = 'line',
  children,
  className,
  onValueChange,
}: TabsProps) {
  const [internalValue, setValueState] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const setValue = (v: string) => {
    setValueState(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value, setValue, variant }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
  variant: listVariant,
}: {
  children: ReactNode;
  className?: string;
  variant?: TabsVariant;
}) {
  const ctx = useContext(TabsContext);
  const variant = listVariant ?? ctx?.variant ?? 'line';

  return (
    <div
      role="tablist"
      className={cn(
        'flex flex-nowrap items-center overflow-x-auto no-scrollbar scroll-smooth',
        variant === 'line' && 'gap-1 border-b border-border/80 pt-1 pb-px',
        variant === 'pills' && 'gap-2 rounded-full border border-border/60 bg-brand-blush/40 p-1.5',
        variant === 'segmented' && 'gap-1 rounded-xl border border-border bg-surface-raised p-1 shadow-2xs',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  variant: triggerVariant,
}: {
  value: string;
  children: ReactNode;
  className?: string;
  variant?: TabsVariant;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be inside Tabs');
  const active = ctx.value === value;
  const variant = triggerVariant ?? ctx.variant ?? 'line';

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-1',
        variant === 'line' &&
          cn(
            '-mb-px rounded-t-lg border-b-2 px-4 py-2.5',
            active
              ? 'border-brand-primary bg-brand-blush/25 font-semibold text-brand-primary'
              : 'border-transparent text-text-secondary hover:bg-brand-blush/10 hover:text-text-primary',
          ),
        variant === 'pills' &&
          cn(
            'rounded-full px-4 py-2 shadow-2xs',
            active
              ? 'bg-brand-primary font-semibold text-text-inverse shadow-xs'
              : 'text-text-secondary hover:bg-brand-blush/50 hover:text-text-primary',
          ),
        variant === 'segmented' &&
          cn(
            'rounded-lg px-3.5 py-1.5 text-xs sm:text-sm',
            active
              ? 'bg-brand-primary font-semibold text-text-inverse shadow-xs'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary',
          ),
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be inside Tabs');
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" className={cn('animate-fade-up pt-4', className)}>
      {children}
    </div>
  );
}

