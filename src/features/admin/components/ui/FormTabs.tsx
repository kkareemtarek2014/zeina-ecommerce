'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface FormTabItem {
  id: string;
  label: string;
  errorCount?: number;
}

export interface FormTabsProps {
  tabs: FormTabItem[];
  active: string;
  onChange: (id: string) => void;
  children?: ReactNode;
  className?: string;
}

export function FormTabs({
  tabs,
  active,
  onChange,
  children,
  className,
}: FormTabsProps) {
  return (
    <div className={cn('w-full', className)}>
      <div
        role="tablist"
        className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto no-scrollbar"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          const hasErrors = Boolean(tab.errorCount && tab.errorCount > 0);

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer',
                isActive
                  ? 'border-brand-primary text-brand-primary font-semibold'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              )}
            >
              <span>{tab.label}</span>
              {hasErrors && (
                <span
                  className="inline-flex items-center justify-center rounded-full bg-status-error px-1.5 py-0.5 text-[10px] font-bold text-white leading-none"
                  title={`${tab.errorCount} error(s)`}
                >
                  {tab.errorCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {children}
    </div>
  );
}

export interface FormTabPanelProps {
  id: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

export function FormTabPanel({
  id,
  activeTab,
  children,
  className,
}: FormTabPanelProps) {
  const isSelected = id === activeTab;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!isSelected}
      className={cn(!isSelected && 'hidden', className)}
    >
      {children}
    </div>
  );
}
