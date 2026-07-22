'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { hasPermission, type Permission } from '@/shared/rbac';
import { useHydrated } from '@/shared/hooks/useHydrated';
import { isFeatureEnabled, type FeatureKey } from '@/config/features.config';
import { cn } from '@/shared/utils/cn';
import { NAV_GROUPS } from '../config/nav.config';

type PaletteItem = {
  id: string;
  label: string;
  href: string;
  group: string;
  keywords?: string;
};

const QUICK_ACTIONS: ReadonlyArray<{
  id: string;
  label: string;
  href: string;
  permission: Permission;
}> = [
    {
      id: 'new-product',
      label: 'New product',
      href: '/admin/products/new',
      permission: 'products:write',
    },
    {
      id: 'new-promo',
      label: 'New promo',
      href: '/admin/promos',
      permission: 'promos:write',
    },
    {
      id: 'new-category',
      label: 'New category',
      href: '/admin/categories/new',
      permission: 'categories:write',
    },
  ];

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = text.toLowerCase();
  if (hay.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < hay.length && qi < q.length; i++) {
    if (hay[i] === q[qi]) qi += 1;
  }
  return qi === q.length;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useHydrated();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const titleId = useId();

  const items = useMemo((): PaletteItem[] => {
    if (!user) return [];

    const navItems: PaletteItem[] = [];
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (!hasPermission(user.role, item.permission)) continue;
        if (
          item.featureFlag &&
          !isFeatureEnabled(item.featureFlag as FeatureKey)
        ) {
          continue;
        }
        navItems.push({
          id: `nav-${item.href}`,
          label: item.label,
          href: item.href,
          group: group.label,
          keywords: `${group.label} ${item.label}`,
        });
      }
    }

    const actions: PaletteItem[] = QUICK_ACTIONS.filter((a) =>
      hasPermission(user.role, a.permission),
    ).map((a) => ({
      id: a.id,
      label: a.label,
      href: a.href,
      group: 'Actions',
      keywords: `new create ${a.label}`,
    }));

    return [...actions, ...navItems];
  }, [user]);

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        fuzzyMatch(query, `${item.label} ${item.group} ${item.keywords ?? ''}`),
      ),
    [items, query],
  );

  const safeActiveIndex =
    filtered.length === 0
      ? 0
      : Math.min(activeIndex, filtered.length - 1);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery('');
    setActiveIndex(0);
  }, [onOpenChange]);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  useEffect(() => {
    if (!isHydrated) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isHydrated, onOpenChange, open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onListKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) =>
        filtered.length === 0 ? 0 : Math.min(i + 1, filtered.length - 1),
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[safeActiveIndex];
      if (item) go(item.href);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-fade-up w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg"
      >
        <h2 id={titleId} className="sr-only">
          Jump to
        </h2>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-text-muted" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onListKeyDown}
            placeholder="Jump to page or action…"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              filtered[safeActiveIndex]
                ? `${listId}-${filtered[safeActiveIndex].id}`
                : undefined
            }
            className="h-12 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-text-muted sm:inline">
            esc
          </kbd>
        </div>

        <ul
          id={listId}
          role="listbox"
          aria-label="Admin destinations"
          className="max-h-72 overflow-y-auto py-2"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-text-muted">
              No matches
            </li>
          ) : (
            filtered.map((item, index) => {
              const isAction = item.group === 'Actions';
              return (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={index === safeActiveIndex}
                >
                  <button
                    type="button"
                    id={`${listId}-${item.id}`}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                      index === safeActiveIndex
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-text-primary hover:bg-brand-blush/40',
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(item.href)}
                  >
                    {isAction ? (
                      <Plus className="size-4 shrink-0 opacity-70" aria-hidden />
                    ) : (
                      <span className="w-4 shrink-0" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {item.label}
                    </span>
                    <span className="shrink-0 text-[11px] text-text-muted">
                      {item.group}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

export function CommandPaletteTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open command palette"
      className="hidden items-center gap-2 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:border-brand-primary hover:text-brand-primary md:inline-flex cursor-pointer"
    >
      <Search className="size-3.5" aria-hidden />
      <span>Jump</span>
      <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-medium">
        ⌘K
      </kbd>
    </button>
  );
}
